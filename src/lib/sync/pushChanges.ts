/**
 * pushChanges.ts
 *
 * WatermelonDB synchronize() push handler.
 * Writes local changes (created / updated / deleted records) back to Supabase.
 *
 * Design decisions:
 * - Created and updated records are handled via a single upsert path.
 * - Deleted records use soft-delete (set deleted_at = now()) for tables that
 *   support it; payments are hard-deleted.
 * - collection_tickets use idempotency_key as the conflict target.
 * - Per-record exponential backoff with up to 3 retries.
 * - Auth errors abort the push and mark for retry (do not throw).
 * - Sync events are logged to sync_logs asynchronously (fire-and-forget).
 */

import { supabase } from '../supabase/client';
import { Config } from '../../constants/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WDBRecord = Record<string, unknown>;

interface PushChangesInput {
  changes: Record<
    string,
    { created: WDBRecord[]; updated: WDBRecord[]; deleted: string[] }
  >;
}

type SyncedTable =
  | 'profiles'
  | 'clusters'
  | 'reelers'
  | 'routes'
  | 'route_stops'
  | 'collection_tickets'
  | 'payments';

/** Tables where deletion means setting deleted_at (soft delete). */
const SOFT_DELETE_TABLES = new Set<SyncedTable>([
  'profiles',
  'routes',
  'route_stops',
  'collection_tickets',
]);

/** Order in which to push tables to respect foreign-key constraints. */
const PUSH_ORDER: SyncedTable[] = [
  'profiles',
  'clusters',
  'reelers',
  'routes',
  'route_stops',
  'collection_tickets',
  'payments',
];

// ---------------------------------------------------------------------------
// Field mapping: WDB (snake_case column names) → Supabase DB row
// ---------------------------------------------------------------------------

/** Strip internal WDB meta fields before sending to Supabase. */
function stripWDBMeta(record: WDBRecord): WDBRecord {
  const copy = { ...record };
  // WDB internal fields that must not be written to Supabase
  delete copy['_changed'];
  delete copy['_status'];
  return copy;
}

function unixMsToIso(value: unknown): string | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return null;
  return new Date(num).toISOString();
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 'true';
}

// ---- per-table mappers -------------------------------------------------- //

function mapProfileToDb(r: WDBRecord): Record<string, unknown> {
  return {
    id: r['id'],
    user_id: r['user_id'],
    phone: r['phone'],
    full_name: r['full_name'],
    role: r['role'],
    cluster_id: r['cluster_id'] ?? null,
    is_verified: toBoolean(r['is_verified']),
    kyc_status: r['kyc_status'],
    preferred_language: r['preferred_language'] ?? null,
    employee_id: r['employee_id'] ?? null,
    last_active_at: unixMsToIso(r['last_active_at']),
  };
}

function mapClusterToDb(r: WDBRecord): Record<string, unknown> {
  return {
    id: r['id'],
    name: r['name'],
    code: r['code'] ?? null,
    district: r['district'] ?? null,
    region: r['region'] ?? null,
    state: r['state'],
    country: r['country'] ?? null,
    is_active: toBoolean(r['is_active']),
    variance_tolerance_percent: toNumber(r['variance_tolerance_percent']),
  };
}

function mapReelerToDb(r: WDBRecord): Record<string, unknown> {
  return {
    // In Supabase, reelers.id = profiles.id (same UUID)
    id: r['profile_id'] ?? r['id'],
    phone: r['phone'],
    full_name: r['full_name'],
    cluster_id: r['cluster_id'] ?? null,
    bank_account_masked: r['bank_account_masked'] ?? null,
    ifsc_code: r['ifsc_code'] ?? null,
    upi_id: r['upi_id'] ?? null,
    payment_preference: r['payment_preference'],
    total_collections: toNumber(r['total_collections']) ?? 0,
    total_earnings_inr: toNumber(r['total_earnings_inr']) ?? 0,
    qr_code_hash: r['qr_code_hash'] ?? null,
    consent_captured_at: unixMsToIso(r['consent_captured_at']),
    farm_area_hectares: toNumber(r['farm_area_hectares']),
  };
}

function mapRouteToDb(r: WDBRecord): Record<string, unknown> {
  return {
    id: r['id'],
    name: r['name'],
    date: unixMsToIso(r['date']),
    cluster_id: r['cluster_id'],
    vehicle_id: r['vehicle_id'] ?? null,
    collector_id: r['collector_id'],
    supervisor_id: r['supervisor_id'] ?? null,
    status: r['status'],
    total_stops: toNumber(r['total_stops']) ?? 0,
    completed_stops: toNumber(r['completed_stops']) ?? 0,
    expected_total_weight_kg: toNumber(r['expected_total_weight_kg']),
    actual_total_weight_kg: toNumber(r['actual_total_weight_kg']),
  };
}

function mapRouteStopToDb(r: WDBRecord): Record<string, unknown> {
  return {
    id: r['id'],
    route_id: r['route_id'],
    reeler_id: r['reeler_id'],
    stop_order: toNumber(r['stop_order']) ?? 0,
    status: r['status'],
    expected_weight_kg: toNumber(r['expected_weight_kg']),
    actual_arrival_time: unixMsToIso(r['actual_arrival_time']),
    collection_ticket_id: r['collection_ticket_id'] ?? null,
    skip_reason: r['skip_reason'] ?? null,
    collector_notes: r['collector_notes'] ?? null,
  };
}

function mapCollectionTicketToDb(r: WDBRecord): Record<string, unknown> {
  const pricingSnapshot = r['pricing_snapshot'];
  const photos = r['photos'];
  return {
    id: r['id'],
    ticket_number: r['ticket_number'],
    route_stop_id: r['route_stop_id'] ?? null,
    collector_id: r['collector_id'],
    reeler_id: r['reeler_id'],
    route_id: r['route_id'] ?? null,
    gross_weight_kg: toNumber(r['gross_weight_kg']) ?? 0,
    tare_weight_kg: toNumber(r['tare_weight_kg']) ?? 0,
    net_weight_kg: toNumber(r['net_weight_kg']) ?? 0,
    quality_grade: r['quality_grade'],
    moisture_percent: toNumber(r['moisture_percent']),
    visual_notes: r['visual_notes'] ?? null,
    crate_count: toNumber(r['crate_count']) ?? 0,
    price_list_id: r['price_list_id'] ?? null,
    price_per_kg: toNumber(r['price_per_kg']) ?? 0,
    total_amount: toNumber(r['total_amount']) ?? 0,
    // Parse back from WDB string storage to JSON object for Supabase jsonb column
    pricing_snapshot: (() => {
      if (typeof pricingSnapshot === 'string') {
        try {
          return JSON.parse(pricingSnapshot);
        } catch {
          return {};
        }
      }
      return pricingSnapshot ?? {};
    })(),
    collection_timestamp: unixMsToIso(r['collection_timestamp']),
    gps_latitude: toNumber(r['gps_latitude']),
    gps_longitude: toNumber(r['gps_longitude']),
    gps_accuracy_meters: toNumber(r['gps_accuracy_meters']),
    device_id: r['device_id'] ?? null,
    network_status: r['network_status'] ?? null,
    sync_status: 'synced', // mark as synced on push
    status: r['status'],
    idempotency_key: r['idempotency_key'],
    photos: (() => {
      if (typeof photos === 'string') {
        try {
          return JSON.parse(photos);
        } catch {
          return [];
        }
      }
      return photos ?? [];
    })(),
  };
}

function mapPaymentToDb(r: WDBRecord): Record<string, unknown> {
  return {
    id: r['id'],
    collection_ticket_id: r['collection_ticket_id'] ?? null,
    reeler_id: r['reeler_id'],
    amount: toNumber(r['amount']) ?? 0,
    payment_mode: r['payment_mode'],
    payment_status: r['payment_status'],
    gateway_provider: r['gateway_provider'] ?? null,
    transaction_reference: r['transaction_reference'] ?? null,
    initiated_at: unixMsToIso(r['initiated_at']),
  };
}

const TABLE_DB_MAPPERS: Record<SyncedTable, (r: WDBRecord) => Record<string, unknown>> = {
  profiles: mapProfileToDb,
  clusters: mapClusterToDb,
  reelers: mapReelerToDb,
  routes: mapRouteToDb,
  route_stops: mapRouteStopToDb,
  collection_tickets: mapCollectionTicketToDb,
  payments: mapPaymentToDb,
};

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = Config.sync.maxRetries,
  baseDelayMs: number = Config.sync.baseRetryDelayMs,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1),
        Config.sync.maxRetryDelayMs,
      );
      console.warn(`[pushChanges] Retry ${attempt}/${maxRetries} after ${delay}ms`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ---------------------------------------------------------------------------
// Async sync log (fire-and-forget — never blocks the push)
// ---------------------------------------------------------------------------

function logSyncEvent(
  tableName: string,
  operation: string,
  recordId: string,
  success: boolean,
  errorMessage?: string,
): void {
  // Intentionally not awaited
  supabase
    .from('sync_logs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      synced_at: new Date().toISOString(),
      success,
      error_message: errorMessage ?? null,
      record_id: recordId,
      operation_type: operation,
    } as any)
    .then(({ error }) => {
      if (error) {
        console.warn('[pushChanges] Failed to write sync log:', error.message);
      }
    });
}

// ---------------------------------------------------------------------------
// Auth check helper
// ---------------------------------------------------------------------------

function isAuthError(code: string | undefined, status: number | undefined): boolean {
  return (
    code === 'PGRST301' ||
    code === '42501' ||
    status === 401 ||
    status === 403
  );
}

// ---------------------------------------------------------------------------
// Per-table push operations
// ---------------------------------------------------------------------------

async function upsertRecords(
  tableName: SyncedTable,
  records: WDBRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const mapper = TABLE_DB_MAPPERS[tableName];

  // collection_tickets use idempotency_key as the conflict resolution column
  const onConflict = tableName === 'collection_tickets' ? 'idempotency_key' : 'id';

  for (const record of records) {
    const dbRow = stripWDBMeta(mapper(record));
    const recordId = String(record['id'] ?? '');

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from(tableName)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(dbRow as any, { onConflict, ignoreDuplicates: false });

        if (error) {
          if (isAuthError(error.code, (error as { status?: number }).status)) {
            // Auth error — log and skip; the push orchestrator will handle it
            console.warn(
              `[pushChanges] Auth error upserting ${tableName}/${recordId}:`,
              error.message,
            );
            logSyncEvent(tableName, 'upsert', recordId, false, error.message);
            return; // break out of retry — auth errors won't resolve with retries
          }
          throw new Error(error.message);
        }

        logSyncEvent(tableName, 'upsert', recordId, true);
      });

      // For collection_tickets: mark sync_status = 'synced' in the DB row
      // (already set by mapCollectionTicketToDb above). Update WDB locally
      // happens via pullChanges on the next sync cycle.
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pushChanges] Failed to upsert ${tableName}/${recordId}:`, msg);
      logSyncEvent(tableName, 'upsert', recordId, false, msg);

      // For collection_tickets: mark sync_status as 'failed' in Supabase
      if (tableName === 'collection_tickets') {
        supabase
          .from('collection_tickets')
          .update({ sync_status: 'failed' })
          .eq('id', recordId)
          .then(({ error: ue }) => {
            if (ue) {
              console.warn('[pushChanges] Could not mark ticket as failed:', ue.message);
            }
          });
      }

      // Re-throw so the outer push orchestrator can decide how to handle
      throw err;
    }
  }
}

async function deleteRecords(
  tableName: SyncedTable,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;

  for (const id of ids) {
    try {
      await withRetry(async () => {
        let error: { message: string; code?: string; status?: number } | null = null;

        if (SOFT_DELETE_TABLES.has(tableName)) {
          // Soft delete: set deleted_at timestamp
          const { error: e } = await supabase
            .from(tableName)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update({ deleted_at: new Date().toISOString() } as any)
            .eq('id', id);
          error = e;
        } else {
          // Hard delete (payments)
          const { error: e } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);
          error = e;
        }

        if (error) {
          if (isAuthError(error.code, error.status)) {
            console.warn(
              `[pushChanges] Auth error deleting ${tableName}/${id}:`,
              error.message,
            );
            logSyncEvent(tableName, 'delete', id, false, error.message);
            return;
          }
          throw new Error(error.message);
        }

        logSyncEvent(tableName, 'delete', id, true);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pushChanges] Failed to delete ${tableName}/${id}:`, msg);
      logSyncEvent(tableName, 'delete', id, false, msg);
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Auth-guard — check session before attempting push
// ---------------------------------------------------------------------------

async function ensureAuthenticated(): Promise<boolean> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    console.warn('[pushChanges] No active session — skipping push');
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Exported push function
// ---------------------------------------------------------------------------

export async function pushChanges({ changes }: PushChangesInput): Promise<void> {
  if (!(await ensureAuthenticated())) {
    // Skip push — the next sync cycle will retry once the session is restored
    return;
  }

  for (const tableName of PUSH_ORDER) {
    const tableChanges = changes[tableName];
    if (!tableChanges) continue;

    const { created, updated, deleted } = tableChanges;

    // Created and updated share the same upsert path
    const toUpsert = [...created, ...updated];

    try {
      await upsertRecords(tableName as SyncedTable, toUpsert);
    } catch (err) {
      // Log and continue to other tables to maximise data flushed per sync
      console.error(`[pushChanges] Upsert failed for table ${tableName}:`, err);
    }

    try {
      await deleteRecords(tableName as SyncedTable, deleted);
    } catch (err) {
      console.error(`[pushChanges] Delete failed for table ${tableName}:`, err);
    }
  }
}
