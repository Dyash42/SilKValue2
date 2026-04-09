import { supabase } from '@/lib/supabase/client';
import type { GateEntryRow, GateQcStatus, OverrideStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateGateEntryParams {
  vehicleId: string;
  collectorId: string;
  routeId: string;
  batchId?: string | null;
  expectedGrossWeightKg: number;
  expectedNetWeightKg: number;
  gateGrossWeightKg: number;
  varianceTolerancePct: number;
  notes?: string | null;
  gateOperatorId: string;
  scaleId: string;
  scaleCalibrationDate: string;
  weighedBy: string;
  vehicleTareWeightKg: number;
  finalAcceptedWeightKg: number;
}

// ---------------------------------------------------------------------------
// createGateEntry
// ---------------------------------------------------------------------------

/**
 * Inserts a new gate entry into Supabase.
 *
 * `variance_percent` and `within_tolerance` are computed server-side as
 * generated columns, so they do not need to be supplied here.
 *
 * The `gate_net_weight_kg` is derived as:
 *   gate_gross_weight_kg - vehicle_tare_weight_kg
 */
export async function createGateEntry(
  params: CreateGateEntryParams,
): Promise<GateEntryRow> {
  const {
    vehicleId,
    collectorId: _collectorId,
    routeId,
    batchId,
    expectedGrossWeightKg,
    expectedNetWeightKg: _expectedNetWeightKg,
    gateGrossWeightKg,
    varianceTolerancePct,
    notes,
    gateOperatorId,
    scaleId,
    scaleCalibrationDate,
    weighedBy,
    vehicleTareWeightKg,
    finalAcceptedWeightKg,
  } = params;

  const now = new Date().toISOString();
  const gateNetWeightKg = gateGrossWeightKg - vehicleTareWeightKg;

  const { data, error } = await supabase
    .from('gate_entries')
    .insert({
      vehicle_id: vehicleId,
      route_id: routeId,
      ledger_batch_id: batchId ?? null,
      expected_gross_weight_kg: expectedGrossWeightKg,
      final_accepted_weight_kg: finalAcceptedWeightKg,
      gate_gross_weight_kg: gateGrossWeightKg,
      gate_net_weight_kg: gateNetWeightKg,
      gate_operator_id: gateOperatorId,
      variance_tolerance_percent: varianceTolerancePct,
      qc_operator_id: gateOperatorId,
      qc_status: 'pending' as GateQcStatus,
      qc_timestamp: now,
      qc_notes: notes ?? null,
      scale_id: scaleId,
      scale_calibration_date: scaleCalibrationDate,
      weighed_by: weighedBy,
      weighed_at: now,
      check_in_timestamp: now,
      vehicle_tare_weight_kg: vehicleTareWeightKg,
      // gate_location is a PostGIS geography; leave null until a GPS point
      // can be provided by the caller.
      gate_location: null as unknown,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`createGateEntry failed: ${error.message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// updateQcDecision
// ---------------------------------------------------------------------------

/**
 * Records a QC decision (pass / fail / conditional) against an existing gate
 * entry. Sets `qc_status`, `qc_inspector_id` (mapped to `qc_operator_id`),
 * `qc_notes`, and `qc_timestamp`.
 */
export async function updateQcDecision(
  entryId: string,
  qcStatus: GateQcStatus,
  inspectorId: string,
  notes?: string,
): Promise<GateEntryRow> {
  const { data, error } = await supabase
    .from('gate_entries')
    .update({
      qc_status: qcStatus,
      qc_operator_id: inspectorId,
      qc_notes: notes ?? null,
      qc_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`updateQcDecision failed for entry ${entryId}: ${error.message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// requestOverride
// ---------------------------------------------------------------------------

/**
 * Raises an override request on a gate entry, typically when the weight
 * variance is outside tolerance.  Sets `override_status = 'requested'`.
 */
export async function requestOverride(
  entryId: string,
  requestedById: string,
  reason: string,
): Promise<GateEntryRow> {
  const { data, error } = await supabase
    .from('gate_entries')
    .update({
      override_status: 'requested' as OverrideStatus,
      override_by: requestedById,
      override_notes: reason,
      override_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`requestOverride failed for entry ${entryId}: ${error.message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// approveOverride
// ---------------------------------------------------------------------------

/**
 * Approves a pending override request. Sets `override_status = 'approved'`
 * and records the approving user.
 */
export async function approveOverride(
  entryId: string,
  approvedById: string,
): Promise<GateEntryRow> {
  const { data, error } = await supabase
    .from('gate_entries')
    .update({
      override_status: 'approved' as OverrideStatus,
      override_by: approvedById,
      override_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`approveOverride failed for entry ${entryId}: ${error.message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// getTodayEntries
// ---------------------------------------------------------------------------

/**
 * Returns all gate entries created today for the given operator, ordered by
 * check-in timestamp descending (most recent first).
 */
export async function getTodayEntries(operatorId: string): Promise<GateEntryRow[]> {
  // Build an ISO timestamp for the start of today (midnight UTC).
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('gate_entries')
    .select('*')
    .eq('gate_operator_id', operatorId)
    .gte('created_at', todayStart.toISOString())
    .order('check_in_timestamp', { ascending: false });

  if (error) {
    throw new Error(`getTodayEntries failed for operator ${operatorId}: ${error.message}`);
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// getEntryById
// ---------------------------------------------------------------------------

/**
 * Fetches a single gate entry by its primary key. Returns null when the entry
 * does not exist.
 */
export async function getEntryById(entryId: string): Promise<GateEntryRow | null> {
  const { data, error } = await supabase
    .from('gate_entries')
    .select('*')
    .eq('id', entryId)
    .maybeSingle();

  if (error) {
    throw new Error(`getEntryById failed for entry ${entryId}: ${error.message}`);
  }

  return data ?? null;
}
