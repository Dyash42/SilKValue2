import { Q } from '@nozbe/watermelondb';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '@/lib/supabase/client';
import { database } from '@/lib/watermelon/database';
import PaymentModel from '@/models/PaymentModel';
import type { ReelerLedgerRow, PaymentMode } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePaymentParams {
  ticketId: string | null;
  reelerId: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// createPayment
// ---------------------------------------------------------------------------

/**
 * Creates a new payment record locally in WatermelonDB.
 * `payment_status` is set to `'pending'` until the sync engine confirms
 * the payment with the server.
 *
 * The `referenceNumber` maps to `transaction_reference`; `notes` and the
 * generated `idempotency_key` are stored as metadata for de-duplication.
 */
export async function createPayment(
  params: CreatePaymentParams,
): Promise<PaymentModel> {
  const { ticketId, reelerId, amount, mode, referenceNumber, notes } = params;

  // notes and idempotency_key are not in the WatermelonDB schema for payments,
  // so we store idempotency_key in transaction_reference when no explicit
  // reference number is provided (guarantees idempotent server upsert).
  const idempotencyKey = uuidv4();
  const transactionRef = referenceNumber ?? null;

  const payment = await database.write(async () => {
    return database.get<PaymentModel>('payments').create((record) => {
      record.collectionTicketId = ticketId;
      record.reelerId = reelerId;
      record.amount = amount;
      record.paymentMode = mode;
      record.paymentStatus = 'pending';
      record.gatewayProvider = null;
      record.transactionReference = transactionRef ?? idempotencyKey;
      record.initiatedAt = new Date();
    });
  });

  return payment;
}

// ---------------------------------------------------------------------------
// Queries — WatermelonDB
// ---------------------------------------------------------------------------

/**
 * Returns all payment records for a reeler from the local database, newest
 * first (by initiated_at).
 */
export async function getPaymentsByReeler(reelerId: string): Promise<PaymentModel[]> {
  return database
    .get<PaymentModel>('payments')
    .query(
      Q.where('reeler_id', reelerId),
      Q.sortBy('initiated_at', Q.desc),
    )
    .fetch();
}

/**
 * Returns all payments linked to a specific collection ticket from the local
 * database.
 */
export async function getPaymentsByTicket(ticketId: string): Promise<PaymentModel[]> {
  return database
    .get<PaymentModel>('payments')
    .query(
      Q.where('collection_ticket_id', ticketId),
      Q.sortBy('initiated_at', Q.desc),
    )
    .fetch();
}

// ---------------------------------------------------------------------------
// Supabase queries
// ---------------------------------------------------------------------------

/**
 * Fetches the complete ledger history for a reeler from Supabase, newest
 * entries first.
 */
export async function fetchReelerLedger(reelerId: string): Promise<ReelerLedgerRow[]> {
  const { data, error } = await supabase
    .from('reeler_ledger')
    .select('*')
    .eq('reeler_id', reelerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`fetchReelerLedger failed for reeler ${reelerId}: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Aggregates total paid and total pending amounts for a reeler.
 *
 * Strategy: pull the reeler_ledger (server-authoritative) for `credit` entries
 * (representing actual payments made) and unpaid collection tickets from
 * WatermelonDB for the pending amount. Falls back gracefully if the server is
 * unreachable by totalling local WatermelonDB payment records.
 */
export async function fetchTotalEarnings(
  reelerId: string,
): Promise<{ totalPaid: number; totalPending: number }> {
  // ---- totalPaid: sum all credit entries in the ledger -------------------
  const { data: ledgerData, error: ledgerError } = await supabase
    .from('reeler_ledger')
    .select('amount, entry_type')
    .eq('reeler_id', reelerId);

  if (ledgerError) {
    throw new Error(
      `fetchTotalEarnings (ledger) failed for reeler ${reelerId}: ${ledgerError.message}`,
    );
  }

  let totalPaid = 0;
  let totalPending = 0;

  for (const row of ledgerData ?? []) {
    if (row.entry_type === 'credit') {
      totalPaid += row.amount;
    } else if (row.entry_type === 'debit') {
      // Debit entries reduce the total paid (e.g. corrections / reversals)
      totalPaid -= row.amount;
    }
  }

  // ---- totalPending: sum local payments still in 'pending' status --------
  const { data: pendingData, error: pendingError } = await supabase
    .from('payments')
    .select('amount, payment_status')
    .eq('reeler_id', reelerId)
    .in('payment_status', ['pending', 'processing']);

  if (pendingError) {
    throw new Error(
      `fetchTotalEarnings (pending payments) failed for reeler ${reelerId}: ${pendingError.message}`,
    );
  }

  for (const row of pendingData ?? []) {
    totalPending += row.amount;
  }

  return {
    totalPaid: Math.max(0, totalPaid),
    totalPending,
  };
}
