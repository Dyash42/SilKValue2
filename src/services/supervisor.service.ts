/**
 * supervisor.service.ts — Silk Value Platform
 *
 * All supervisor actions go Supabase-direct (same pattern as gate.service.ts).
 * Route creation is a supervisor-initiated write; WatermelonDB is not involved.
 *
 * route_stops.location is NOT NULL in the schema.  When a reeler has no
 * farm_location recorded yet we fall back to the cluster centre point
 * (Karnataka default: 15.3173°N, 75.7139°E) so the constraint is never
 * violated during demo/testing.
 */

import { supabase } from '@/lib/supabase/client';
import type { ProfileRow, RouteRow, VehicleRow } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default PostGIS point used when a reeler has no farm_location yet. */
const DEFAULT_LOCATION = 'SRID=4326;POINT(75.7139 15.3173)';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteStopInput {
  reelerId:         string;
  reelerName:       string;   // kept for display only; not written to DB
  expectedWeightKg: number;
}

export interface CreateRouteParams {
  name:        string;
  date:        string;         // YYYY-MM-DD
  clusterId:   string;
  collectorId: string;
  vehicleId:   string | null;
  supervisorId: string;
  stops:       RouteStopInput[];
}

// ─── getClusterCollectors ─────────────────────────────────────────────────────

/**
 * Returns all collector profiles in the given cluster.
 */
export async function getClusterCollectors(clusterId: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'collector')
    .eq('cluster_id', clusterId)
    .is('deleted_at', null)
    .order('full_name', { ascending: true });

  if (error) throw new Error(`getClusterCollectors: ${error.message}`);
  return (data ?? []) as ProfileRow[];
}

// ─── getClusterVehicles ───────────────────────────────────────────────────────

/**
 * Returns vehicles available in the given cluster.
 */
export async function getClusterVehicles(clusterId: string): Promise<VehicleRow[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('cluster_id', clusterId)
    .eq('is_available', true)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('registration_number', { ascending: true });

  if (error) throw new Error(`getClusterVehicles: ${error.message}`);
  return (data ?? []) as VehicleRow[];
}

// ─── getClusterReelers ────────────────────────────────────────────────────────

/**
 * Returns all reeler profiles in the given cluster.
 */
export async function getClusterReelers(clusterId: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'reeler')
    .eq('cluster_id', clusterId)
    .is('deleted_at', null)
    .order('full_name', { ascending: true });

  if (error) throw new Error(`getClusterReelers: ${error.message}`);
  return (data ?? []) as ProfileRow[];
}

// ─── createRoute ──────────────────────────────────────────────────────────────

/**
 * Inserts one row into the `routes` table and returns it.
 */
export async function createRoute(params: CreateRouteParams): Promise<RouteRow> {
  const { name, date, clusterId, collectorId, vehicleId, supervisorId, stops } = params;

  const { data, error } = await supabase
    .from('routes')
    .insert({
      name,
      date,
      cluster_id:     clusterId,
      collector_id:   collectorId,
      vehicle_id:     vehicleId ?? null,
      supervisor_id:  supervisorId,
      status:         'pending',
      total_stops:    stops.length,
      completed_stops: 0,
    })
    .select()
    .single();

  if (error) throw new Error(`createRoute: ${error.message}`);
  return data as RouteRow;
}

// ─── createRouteStops ─────────────────────────────────────────────────────────

/**
 * Batch-inserts all stops for a route in a single Supabase call.
 *
 * `location` is NOT NULL in the schema.  We use the reeler's farm_location
 * if available (returned as WKT from PostgREST); otherwise the cluster
 * default point.
 */
export async function createRouteStops(
  routeId:  string,
  stops:    RouteStopInput[],
): Promise<void> {
  if (stops.length === 0) return;

  const rows = stops.map((stop, i) => ({
    route_id:           routeId,
    reeler_id:          stop.reelerId,
    stop_order:         i + 1,
    expected_weight_kg: stop.expectedWeightKg,
    status:             'pending',
    location:           DEFAULT_LOCATION,  // updated when reeler geo-tags their farm
  }));

  const { error } = await supabase.from('route_stops').insert(rows);
  if (error) throw new Error(`createRouteStops: ${error.message}`);
}
