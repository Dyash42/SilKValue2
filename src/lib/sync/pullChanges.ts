/**
 * pullChanges.ts
 *
 * WatermelonDB synchronize() pull handler.
 * Fetches all rows modified or soft-deleted since lastPulledAt from Supabase
 * and maps them to the WatermelonDB SyncPullResult shape.
 */

import { supabase } from '../supabase/client';
import { Config } from '../../constants/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WDBRecord = Record<string, unknown>;

export interface TableChanges {
  created: WDBRecord[];
  updated: WDBRecord[];
  deleted: string[];
}

export interface SyncPullResult {
  changes: Record<string, TableChanges>;
  timestamp: number;
}

/** Names of all synced tables in dependency order. */
const SYNCED_TABLES = [
  'profiles',
  'clusters',
  'reelers',
  'routes',
  'route_stops',
  'collection_tickets',
  'payments',
] as const;

type SyncedTable = (typeof SYNCED_TABLES)[number];

// ---------------------------------------------------------------------------
// Field mapping helpers
// ---------------------------------------------------------------------------

/** Convert an ISO-8601 date string or Date to unix milliseconds. Returns null
 * when the input is falsy. */
function isoToUnixMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Map a raw Supabase row for `profiles` → WatermelonDB record.
 * WDB uses the same snake_case column names as the schema defines.
 */
function mapProfile(row: Record<string, unknown>): WDBRecord {
  return {
    id: row['id'],
    user_id: row['user_id'] ?? row['id'], // profiles.id IS the user id
    phone: row['phone'],
    full_name: row['full_name'],
    role: row['role'],
    cluster_id: row['cluster_id'] ?? null,
    is_verified: row['is_verified'] ?? false,
    kyc_status: row['kyc_status'] ?? 'pending',
    preferred_language: row['preferred_language'] ?? null,
    employee_id: row['employee_id'] ?? null,
    last_active_at: isoToUnixMs(row['last_active_at'] as string | null),
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

function mapCluster(row: Record<string, unknown>): WDBRecord {
  return {
    id: row['id'],
    name: row['name'],
    code: row['code'] ?? null,
    district: row['district'] ?? null,
    region: row['region'] ?? null,
    state: row['state'],
    country: row['country'] ?? null,
    is_active: row['is_active'] ?? true,
    variance_tolerance_percent: row['variance_tolerance_percent'] ?? null,
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

function mapReeler(row: Record<string, unknown>): WDBRecord {
  return {
    // WDB reelers table uses profile_id (= reelers.id in Supabase)
    id: row['id'],
    profile_id: row['id'] as string,
    phone: row['phone'],
    full_name: row['full_name'],
    cluster_id: row['cluster_id'] ?? null,
    bank_account_masked: row['bank_account_masked'] ?? null,
    ifsc_code: row['ifsc_code'] ?? null,
    upi_id: row['upi_id'] ?? null,
    payment_preference: row['payment_preference'] ?? 'cash',
    total_collections: row['total_collections'] ?? 0,
    total_earnings_inr: row['total_earnings_inr'] ?? 0,
    qr_code_hash: row['qr_code_hash'] ?? null,
    consent_captured_at: isoToUnixMs(row['consent_captured_at'] as string | null),
    farm_area_hectares: row['farm_area_hectares'] ?? null,
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

function mapRoute(row: Record<string, unknown>): WDBRecord {
  return {
    id: row['id'],
    name: row['name'],
    date: isoToUnixMs(row['date'] as string | null),
    cluster_id: row['cluster_id'],
    vehicle_id: row['vehicle_id'] ?? null,
    collector_id: row['collector_id'],
    supervisor_id: row['supervisor_id'] ?? null,
    status: row['status'],
    total_stops: row['total_stops'] ?? 0,
    completed_stops: row['completed_stops'] ?? 0,
    expected_total_weight_kg: row['expected_total_weight_kg'] ?? null,
    actual_total_weight_kg: row['actual_total_weight_kg'] ?? null,
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

function mapRouteStop(row: Record<string, unknown>): WDBRecord {
  return {
    id: row['id'],
    route_id: row['route_id'],
    reeler_id: row['reeler_id'],
    stop_order: row['stop_order'] ?? 0,
    status: row['status'],
    expected_weight_kg: row['expected_weight_kg'] ?? null,
    actual_arrival_time: isoToUnixMs(row['actual_arrival_time'] as string | null),
    collection_ticket_id: row['collection_ticket_id'] ?? null,
    skip_reason: row['skip_reason'] ?? null,
    collector_notes: row['collector_notes'] ?? null,
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

function mapCollectionTicket(row: Record<string, unknown>): WDBRecord {
  const pricingSnapshot = row['pricing_snapshot'];
  const photos = row['photos'];
  return {
    id: row['id'],
    ticket_number: row['ticket_number'],
    route_stop_id: row['route_stop_id'] ?? null,
    collector_id: row['collector_id'],
    reeler_id: row['reeler_id'],
    route_id: row['route_id'] ?? null,
    gross_weight_kg: row['gross_weight_kg'] ?? 0,
    tare_weight_kg: row['tare_weight_kg'] ?? 0,
    net_weight_kg: row['net_weight_kg'] ?? 0,
    quality_grade: row['quality_grade'],
    moisture_percent: row['moisture_percent'] ?? null,
    visual_notes: row['visual_notes'] ?? null,
    crate_count: row['crate_count'] ?? 0,
    price_list_id: row['price_list_id'] ?? null,
    price_per_kg: row['price_per_kg'] ?? 0,
    total_amount: row['total_amount'] ?? 0,
    // Ensure pricing_snapshot is stored as a JSON string in WDB
    pricing_snapshot:
      typeof pricingSnapshot === 'string'
        ? pricingSnapshot
        : JSON.stringify(pricingSnapshot ?? {}),
    collection_timestamp: isoToUnixMs(row['collection_timestamp'] as string | null),
    gps_latitude: row['gps_latitude'] ?? null,
    gps_longitude: row['gps_longitude'] ?? null,
    gps_accuracy_meters: row['gps_accuracy_meters'] ?? null,
    device_id: row['device_id'] ?? null,
    network_status: row['network_status'] ?? null,
    sync_status: row['sync_status'] ?? 'synced',
    status: row['status'],
    idempotency_key: row['idempotency_key'] ?? '',
    // Ensure photos is stored as a JSON string in WDB
    photos:
      typeof photos === 'string'
        ? photos
        : photos != null
          ? JSON.stringify(photos)
          : null,
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

function mapPayment(row: Record<string, unknown>): WDBRecord {
  return {
    id: row['id'],
    collection_ticket_id: row['collection_ticket_id'] ?? null,
    reeler_id: row['reeler_id'],
    amount: row['amount'] ?? 0,
    payment_mode: row['payment_mode'],
    payment_status: row['payment_status'],
    gateway_provider: row['gateway_provider'] ?? null,
    transaction_reference: row['transaction_reference'] ?? null,
    initiated_at: isoToUnixMs(row['initiated_at'] as string | null),
    server_updated_at: isoToUnixMs(row['updated_at'] as string | null),
  };
}

/** Dispatch table — maps table name to its row mapper function. */
const TABLE_MAPPERS: Record<SyncedTable, (row: Record<string, unknown>) => WDBRecord> = {
  profiles: mapProfile,
  clusters: mapCluster,
  reelers: mapReeler,
  routes: mapRoute,
  route_stops: mapRouteStop,
  collection_tickets: mapCollectionTicket,
  payments: mapPayment,
};

// ---------------------------------------------------------------------------
// Core pull logic
// ---------------------------------------------------------------------------

/**
 * Fetch up to `batchSize` live rows and soft-deleted row ids for a single
 * table since `since` (unix ms).  Returns `{ created, updated, deleted }`.
 *
 * WatermelonDB treats all pulled rows as "created or updated" — it reconciles
 * internally.  We put every live row in `updated` and the IDs of deleted rows
 * in `deleted`; an empty `created` array is intentional here because WDB
 * handles upserts through `updated`.
 */
async function pullTable(
  tableName: SyncedTable,
  since: string | null,
  batchSize: number,
): Promise<TableChanges> {
  const mapper = TABLE_MAPPERS[tableName];

  // ------ live rows -------------------------------------------------------
  let liveQuery = supabase
    .from(tableName)
    .select('*')
    .order('updated_at', { ascending: true })
    .limit(batchSize);

  if (since) {
    liveQuery = liveQuery.gt('updated_at', since).is('deleted_at', null);
  } else {
    liveQuery = liveQuery.is('deleted_at', null);
  }

  const { data: liveRows, error: liveError } = await liveQuery;

  if (liveError) {
    // RLS / auth error — return empty changes rather than crashing the sync
    if (
      liveError.code === 'PGRST301' || // JWT expired
      liveError.code === '42501' || // insufficient_privilege
      (liveError as { status?: number }).status === 401 ||
      (liveError as { status?: number }).status === 403
    ) {
      console.warn(`[pullChanges] RLS/auth error on ${tableName}:`, liveError.message);
      return { created: [], updated: [], deleted: [] };
    }
    throw new Error(`[pullChanges] Failed to fetch ${tableName}: ${liveError.message}`);
  }

  const updated: WDBRecord[] = (liveRows ?? []).map((r) =>
    mapper(r as Record<string, unknown>),
  );

  // ------ deleted rows ----------------------------------------------------
  let deletedQuery = supabase
    .from(tableName)
    .select('id')
    .not('deleted_at', 'is', null)
    .limit(batchSize);

  if (since) {
    deletedQuery = deletedQuery.gt('deleted_at', since);
  }

  const { data: deletedRows, error: deletedError } = await deletedQuery;

  if (deletedError) {
    if (
      deletedError.code === 'PGRST301' ||
      deletedError.code === '42501' ||
      (deletedError as { status?: number }).status === 401 ||
      (deletedError as { status?: number }).status === 403
    ) {
      console.warn(
        `[pullChanges] RLS/auth error fetching deleted rows on ${tableName}:`,
        deletedError.message,
      );
      return { created: [], updated, deleted: [] };
    }
    throw new Error(
      `[pullChanges] Failed to fetch deleted rows for ${tableName}: ${deletedError.message}`,
    );
  }

  const deleted: string[] = (deletedRows ?? []).map(
    (r) => (r as { id: string }).id,
  );

  return { created: [], updated, deleted };
}

// ---------------------------------------------------------------------------
// Exported pull function
// ---------------------------------------------------------------------------

export async function pullChanges({
  lastPulledAt,
}: {
  lastPulledAt: number | null;
}): Promise<SyncPullResult> {
  const batchSize = Config.sync.pullBatchSize;

  // Convert unix ms → ISO string for Supabase .gt() comparisons.
  // null means "pull everything" (initial sync).
  const since: string | null =
    lastPulledAt != null ? new Date(lastPulledAt).toISOString() : null;

  const changes: Record<string, TableChanges> = {};

  // Pull tables in parallel — they are logically independent for reads.
  await Promise.all(
    SYNCED_TABLES.map(async (tableName) => {
      try {
        changes[tableName] = await pullTable(tableName, since, batchSize);
      } catch (err) {
        console.error(`[pullChanges] Error pulling ${tableName}:`, err);
        // Degrade gracefully: contribute empty changes for this table so the
        // rest of the sync can proceed.
        changes[tableName] = { created: [], updated: [], deleted: [] };
      }
    }),
  );

  return {
    changes,
    timestamp: Date.now(),
  };
}
