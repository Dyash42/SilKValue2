import { Q } from '@nozbe/watermelondb';

import { supabase } from '@/lib/supabase/client';
import { database } from '@/lib/watermelon/database';
import RouteModel from '@/models/RouteModel';
import RouteStopModel from '@/models/RouteStopModel';
import type { RouteRow, RouteStopRow } from '@/types';

// ---------------------------------------------------------------------------
// getActiveRoutes
// ---------------------------------------------------------------------------

/**
 * Returns all locally-cached active routes for a collector from WatermelonDB.
 * A route is considered active when its `status` is not `'completed'` or
 * `'cancelled'`.
 */
export async function getActiveRoutes(collectorId: string): Promise<RouteModel[]> {
  return database
    .get<RouteModel>('routes')
    .query(
      Q.where('collector_id', collectorId),
      Q.where('status', Q.notIn(['completed', 'cancelled'])),
    )
    .fetch();
}

// ---------------------------------------------------------------------------
// getRouteStops
// ---------------------------------------------------------------------------

/**
 * Returns all stops for a route from WatermelonDB, ordered by `stop_order`
 * ascending.
 */
export async function getRouteStops(routeId: string): Promise<RouteStopModel[]> {
  return database
    .get<RouteStopModel>('route_stops')
    .query(
      Q.where('route_id', routeId),
      Q.sortBy('stop_order', Q.asc),
    )
    .fetch();
}

// ---------------------------------------------------------------------------
// markStopVisited
// ---------------------------------------------------------------------------

/**
 * Marks a route stop as visited by setting `actual_arrival_time` to now and
 * `status` to `'completed'`.
 */
export async function markStopVisited(stopId: string): Promise<RouteStopModel> {
  const stop = await database.get<RouteStopModel>('route_stops').find(stopId);

  if (!stop) {
    throw new Error(`markStopVisited: stop with id "${stopId}" not found.`);
  }

  await database.write(async () => {
    await stop.update((record) => {
      record.actualArrivalTime = new Date();
      record.status = 'completed';
    });
  });

  return stop;
}

// ---------------------------------------------------------------------------
// getRouteProgress
// ---------------------------------------------------------------------------

/**
 * Computes progress statistics for a route by counting total stops and how
 * many have been completed locally.
 */
export async function getRouteProgress(
  routeId: string,
): Promise<{ totalStops: number; completedStops: number; percentComplete: number }> {
  const allStops = await database
    .get<RouteStopModel>('route_stops')
    .query(Q.where('route_id', routeId))
    .fetch();

  const totalStops = allStops.length;
  const completedStops = allStops.filter((s) => s.status === 'completed').length;
  const percentComplete =
    totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return { totalStops, completedStops, percentComplete };
}

// ---------------------------------------------------------------------------
// fetchRoutesFromServer
// ---------------------------------------------------------------------------

/**
 * Pulls active routes and their stops for a collector from Supabase and
 * upserts them into WatermelonDB.
 *
 * Upsert strategy:
 *  - If a local record with the same `id` exists, update it.
 *  - Otherwise, create a new record.
 *
 * This function is intentionally simple (full replace) and is expected to run
 * at app startup or when the user triggers a manual refresh.
 */
export async function fetchRoutesFromServer(collectorId: string): Promise<void> {
  // 1. Fetch routes from Supabase
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('*')
    .eq('collector_id', collectorId)
    .not('status', 'eq', 'cancelled')
    .not('deleted_at', 'is', null === null ? 'null' : null);

  if (routesError) {
    throw new Error(
      `fetchRoutesFromServer: failed to fetch routes for collector ${collectorId}: ${routesError.message}`,
    );
  }

  const serverRoutes = (routes ?? []) as RouteRow[];

  if (serverRoutes.length === 0) {
    return;
  }

  const routeIds = serverRoutes.map((r) => r.id);

  // 2. Fetch all stops for these routes in a single query
  const { data: stops, error: stopsError } = await supabase
    .from('route_stops')
    .select('*')
    .in('route_id', routeIds);

  if (stopsError) {
    throw new Error(
      `fetchRoutesFromServer: failed to fetch route stops: ${stopsError.message}`,
    );
  }

  const serverStops = (stops ?? []) as RouteStopRow[];

  // 3. Upsert everything inside a single WatermelonDB transaction
  await database.write(async () => {
    // -- Routes --
    for (const serverRoute of serverRoutes) {
      const existing = await database
        .get<RouteModel>('routes')
        .query(Q.where('id', serverRoute.id))
        .fetch()
        .then((rows) => rows[0] ?? null);

      if (existing) {
        await existing.update((record) => {
          record.name = serverRoute.name;
          record.date = new Date(serverRoute.date);
          record.clusterId = serverRoute.cluster_id;
          record.vehicleId = serverRoute.vehicle_id ?? null;
          record.collectorId = serverRoute.collector_id;
          record.supervisorId = serverRoute.supervisor_id ?? null;
          record.status = serverRoute.status ?? 'planned';
          record.totalStops = serverRoute.total_stops ?? 0;
          record.completedStops = serverRoute.completed_stops ?? 0;
          record.expectedTotalWeightKg = serverRoute.expected_total_weight_kg ?? null;
          record.actualTotalWeightKg = serverRoute.actual_total_weight_kg ?? null;
          record.serverUpdatedAt = serverRoute.updated_at
            ? new Date(serverRoute.updated_at)
            : null;
        });
      } else {
        await database.get<RouteModel>('routes').create((record) => {
          // WatermelonDB assigns its own local `id`; we use it as the record
          // identity here.  The server id is not stored separately because the
          // WatermelonDB `id` is used as the sync key.
          record._raw.id = serverRoute.id;
          record.name = serverRoute.name;
          record.date = new Date(serverRoute.date);
          record.clusterId = serverRoute.cluster_id;
          record.vehicleId = serverRoute.vehicle_id ?? null;
          record.collectorId = serverRoute.collector_id;
          record.supervisorId = serverRoute.supervisor_id ?? null;
          record.status = serverRoute.status ?? 'planned';
          record.totalStops = serverRoute.total_stops ?? 0;
          record.completedStops = serverRoute.completed_stops ?? 0;
          record.expectedTotalWeightKg = serverRoute.expected_total_weight_kg ?? null;
          record.actualTotalWeightKg = serverRoute.actual_total_weight_kg ?? null;
          record.serverUpdatedAt = serverRoute.updated_at
            ? new Date(serverRoute.updated_at)
            : null;
        });
      }
    }

    // -- Route Stops --
    for (const serverStop of serverStops) {
      const existingStops = await database
        .get<RouteStopModel>('route_stops')
        .query(Q.where('id', serverStop.id))
        .fetch();

      const existingStop = existingStops[0] ?? null;

      if (existingStop) {
        await existingStop.update((record) => {
          record.routeId = serverStop.route_id;
          record.reelerId = serverStop.reeler_id;
          record.stopOrder = serverStop.stop_order;
          record.status = serverStop.status ?? 'pending';
          record.expectedWeightKg = serverStop.expected_weight_kg ?? null;
          record.actualArrivalTime = serverStop.actual_arrival_time
            ? new Date(serverStop.actual_arrival_time)
            : null;
          record.collectionTicketId = serverStop.collection_ticket_id ?? null;
          record.skipReason = serverStop.skip_reason ?? null;
          record.collectorNotes = serverStop.collector_notes ?? null;
          record.serverUpdatedAt = serverStop.updated_at
            ? new Date(serverStop.updated_at)
            : null;
        });
      } else {
        await database.get<RouteStopModel>('route_stops').create((record) => {
          record._raw.id = serverStop.id;
          record.routeId = serverStop.route_id;
          record.reelerId = serverStop.reeler_id;
          record.stopOrder = serverStop.stop_order;
          record.status = serverStop.status ?? 'pending';
          record.expectedWeightKg = serverStop.expected_weight_kg ?? null;
          record.actualArrivalTime = serverStop.actual_arrival_time
            ? new Date(serverStop.actual_arrival_time)
            : null;
          record.collectionTicketId = serverStop.collection_ticket_id ?? null;
          record.skipReason = serverStop.skip_reason ?? null;
          record.collectorNotes = serverStop.collector_notes ?? null;
          record.serverUpdatedAt = serverStop.updated_at
            ? new Date(serverStop.updated_at)
            : null;
        });
      }
    }
  });
}
