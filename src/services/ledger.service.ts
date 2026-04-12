/**
 * ledger.service.ts — Silk Value Platform
 *
 * All ledger operations go Supabase-direct (same pattern as gate.service.ts).
 * The reeler_ledger table stores double-entry-style credits/debits with a
 * running balance_after field on every row.
 *
 * reeler_ledger.reeler_id = reelers.id = profiles.id (same UUID, confirmed by
 * schema FK chain: reeler_ledger → reelers ← profiles).
 */

import { supabase } from '@/lib/supabase/client';
import type { ReelerLedgerRow } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LedgerSummary {
  /** Current balance (most recent balance_after in the ledger). */
  balance: number;
  /** Sum of all credit entries ever. */
  totalCredited: number;
  /** Sum of all debit entries ever. */
  totalDebited: number;
  /** Total number of ledger rows. */
  entryCount: number;
}

export interface CreditGateClearanceParams {
  /** profiles.id / reelers.id of the reeler being credited. */
  reelerId: string;
  /** gate_entries.id that triggered this credit. */
  entryId: string;
  /** Final accepted weight after deductions (kg). */
  finalWeightKg: number;
  /** Amount to credit in INR. */
  amountInr: number;
  /** Profile ID of the gate operator who accepted. */
  operatorId: string;
}

// ─── getLedgerEntries ─────────────────────────────────────────────────────────

/**
 * Returns the most recent ledger entries for a reeler, newest first.
 * Default limit is 50; pass 0 for unlimited.
 */
export async function getLedgerEntries(
  reelerId: string,
  limit = 50,
): Promise<ReelerLedgerRow[]> {
  let query = supabase
    .from('reeler_ledger')
    .select('*')
    .eq('reeler_id', reelerId)
    .order('created_at', { ascending: false });

  if (limit > 0) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`getLedgerEntries: ${error.message}`);
  return (data ?? []) as ReelerLedgerRow[];
}

// ─── getLedgerSummary ─────────────────────────────────────────────────────────

/**
 * Computes total credited, total debited, current balance, and entry count
 * for a reeler from their full ledger history.
 *
 * Current balance = balance_after of the most recent entry (or 0 if no entries).
 */
export async function getLedgerSummary(reelerId: string): Promise<LedgerSummary> {
  const { data, error } = await supabase
    .from('reeler_ledger')
    .select('entry_type, amount, balance_after, created_at')
    .eq('reeler_id', reelerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getLedgerSummary: ${error.message}`);

  const rows = data ?? [];
  if (rows.length === 0) {
    return { balance: 0, totalCredited: 0, totalDebited: 0, entryCount: 0 };
  }

  let totalCredited = 0;
  let totalDebited = 0;
  for (const row of rows) {
    if (row.entry_type === 'credit') totalCredited += row.amount;
    else totalDebited += row.amount;
  }

  // The most recent row (first after DESC sort) has the current running balance
  const balance = rows[0].balance_after;

  return { balance, totalCredited, totalDebited, entryCount: rows.length };
}

// ─── creditGateClearance ──────────────────────────────────────────────────────

/**
 * Credits a reeler's ledger after a gate entry is QC-accepted.
 *
 * Steps:
 *  1. Fetch current balance (latest balance_after for this reeler).
 *  2. Insert a credit row in reeler_ledger.
 *  3. Mark gate_entries.ledger_updated = true so duplicate credits are prevented.
 *
 * This function is idempotent in intent: callers should check
 * gate_entries.ledger_updated before calling.
 */
export async function creditGateClearance(
  params: CreditGateClearanceParams,
): Promise<void> {
  const { reelerId, entryId, finalWeightKg, amountInr, operatorId } = params;

  // ── Step 1: Current balance ──────────────────────────────────────────────────
  const { data: lastEntry } = await supabase
    .from('reeler_ledger')
    .select('balance_after')
    .eq('reeler_id', reelerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentBalance = lastEntry?.balance_after ?? 0;
  const newBalance = currentBalance + amountInr;

  // ── Step 2: Insert credit row ────────────────────────────────────────────────
  const { error: insertErr } = await supabase
    .from('reeler_ledger')
    .insert({
      reeler_id:      reelerId,
      entry_type:     'credit',
      amount:         amountInr,
      balance_after:  newBalance,
      reference_id:   entryId,
      reference_type: 'gate_adjustment',
      description:    `Gate clearance — ${finalWeightKg.toFixed(1)} kg accepted`,
      created_by:     operatorId,
    });

  if (insertErr) throw new Error(`creditGateClearance (insert): ${insertErr.message}`);

  // ── Step 3: Mark gate entry as ledger-updated ────────────────────────────────
  const { error: updateErr } = await supabase
    .from('gate_entries')
    .update({
      ledger_updated:    true,
      ledger_updated_at: new Date().toISOString(),
      ledger_updated_by: operatorId,
    })
    .eq('id', entryId);

  if (updateErr) {
    // Non-fatal: the credit already went through. Log and continue.
    console.warn(`creditGateClearance: could not mark gate entry — ${updateErr.message}`);
  }
}

// ─── resolveReelerFromGateEntry ───────────────────────────────────────────────

/**
 * Attempts to resolve the reeler_id for a gate entry by following:
 *   gate_entries.route_id → routes → route_stops → reeler_id (first stop)
 *
 * Returns null if the route is unknown, has no stops, or any query fails.
 * This is best-effort — callers should handle null gracefully.
 */
export async function resolveReelerFromGateEntry(
  entryId: string,
): Promise<string | null> {
  try {
    // Fetch the gate entry to get route_id
    const { data: entry, error: entryErr } = await supabase
      .from('gate_entries')
      .select('route_id, ledger_updated')
      .eq('id', entryId)
      .maybeSingle();

    if (entryErr || !entry) return null;
    // Already credited — skip
    if (entry.ledger_updated) return null;

    const routeId = entry.route_id;
    if (!routeId || routeId === 'unknown') return null;

    // Fetch the first stop for this route to get the reeler_id
    const { data: stops, error: stopsErr } = await supabase
      .from('route_stops')
      .select('reeler_id')
      .eq('route_id', routeId)
      .order('stop_order', { ascending: true })
      .limit(1);

    if (stopsErr || !stops || stops.length === 0) return null;
    return stops[0].reeler_id ?? null;
  } catch {
    return null;
  }
}
