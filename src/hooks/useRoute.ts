import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import type { Subscription } from 'rxjs';

import { database } from '@/lib/watermelon/database';
import RouteModel from '@/models/RouteModel';
import RouteStopModel from '@/models/RouteStopModel';
import * as RouteService from '@/services/route.service';
import { useAuthStore } from '@/stores/auth.store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteProgress {
  totalStops: number;
  completedStops: number;
  percentComplete: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRoute() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [routes, setRoutes] = useState<RouteModel[]>([]);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteModel | null>(null);
  const [stops, setStops] = useState<RouteStopModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // -------------------------------------------------------------------------
  // Live query: active routes for the current collector
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!userId) {
      setRoutes([]);
      setIsLoading(false);
      return;
    }

    const routesCollection = database.get<RouteModel>('routes');

    const subscription: Subscription = routesCollection
      .query(
        Q.and(
          Q.where('collector_id', userId),
          Q.where('status', Q.oneOf(['planned', 'in_progress'])),
        ),
      )
      .observe()
      .subscribe({
        next: (liveRoutes) => {
          setRoutes(liveRoutes);
          setIsLoading(false);
        },
        error: (err: unknown) => {
          console.error('[useRoute] Routes query error:', err);
          setIsLoading(false);
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // -------------------------------------------------------------------------
  // Live query: stops for the currently-selected route
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!currentRouteId) {
      setCurrentRoute(null);
      setStops([]);
      return;
    }

    const routesCollection = database.get<RouteModel>('routes');
    const stopsCollection = database.get<RouteStopModel>('route_stops');

    // Fetch the route record once to populate currentRoute
    const routeSubscription: Subscription = routesCollection
      .query(Q.where('id', currentRouteId))
      .observe()
      .subscribe({
        next: (results) => setCurrentRoute(results[0] ?? null),
        error: (err: unknown) => {
          console.error('[useRoute] Current route query error:', err);
        },
      });

    // Observe stops ordered by stop_order
    const stopsSubscription: Subscription = stopsCollection
      .query(
        Q.and(
          Q.where('route_id', currentRouteId),
          Q.sortBy('stop_order', Q.asc),
        ),
      )
      .observe()
      .subscribe({
        next: (liveStops) => setStops(liveStops),
        error: (err: unknown) => {
          console.error('[useRoute] Stops query error:', err);
        },
      });

    return () => {
      routeSubscription.unsubscribe();
      stopsSubscription.unsubscribe();
    };
  }, [currentRouteId]);

  // -------------------------------------------------------------------------
  // selectRoute
  // -------------------------------------------------------------------------
  const selectRoute = useCallback((routeId: string): void => {
    setCurrentRouteId(routeId);
  }, []);

  // -------------------------------------------------------------------------
  // markStopVisited
  // -------------------------------------------------------------------------
  const markStopVisited = useCallback(async (stopId: string): Promise<void> => {
    try {
      await RouteService.markStopVisited(stopId);
    } catch (err: unknown) {
      console.error('[useRoute] markStopVisited error:', err);
      throw err;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Derived: progress
  // -------------------------------------------------------------------------
  const totalStops = stops.length;
  const completedStops = stops.filter((s) => s.status === 'visited').length;
  const percentComplete =
    totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const progress: RouteProgress = {
    totalStops,
    completedStops,
    percentComplete,
  };

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    routes,
    currentRoute,
    stops,
    selectRoute,
    markStopVisited,
    progress,
    isLoading,
  } as const;
}
