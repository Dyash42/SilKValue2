/**
 * conflictResolver.ts
 *
 * Conflict resolution strategy for the Silk Value offline-first sync engine.
 *
 * Rules (in priority order):
 *  1. Server wins for:
 *     - profiles.kyc_status, profiles.is_verified  (authoritative server state)
 *     - payments.payment_status                    (gateway-driven, never overwrite)
 *  2. Client wins for:
 *     - collection_tickets where local status = 'submitted' AND server status = 'draft'
 *       (collector has already confirmed; server draft is stale)
 *  3. Last-write-wins (by updated_at unix ms) for:
 *     - routes, route_stops, clusters, reelers     (whichever was modified more recently)
 *  4. For `merge` resolution, specific fields from server and client are cherry-picked
 *     depending on the table (see mergeRecords).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConflictResolution = 'server_wins' | 'client_wins' | 'merge';

export interface ConflictContext {
  tableName: string;
  localRecord: Record<string, unknown>;
  serverRecord: Record<string, unknown>;
  /** Unix milliseconds of the local record's last modification. */
  localUpdatedAt: number;
  /** Unix milliseconds of the server record's last modification. */
  serverUpdatedAt: number;
}

// ---------------------------------------------------------------------------
// resolveConflict
// ---------------------------------------------------------------------------

/**
 * Determines the resolution strategy for a conflict between a local and a
 * server version of the same record.
 *
 * Returns one of:
 *   'server_wins' — discard local changes, keep server record as-is
 *   'client_wins' — push local record, overwrite server
 *   'merge'       — cherry-pick fields from each side (see mergeRecords)
 */
export function resolveConflict(ctx: ConflictContext): ConflictResolution {
  const { tableName, localRecord, serverRecord, localUpdatedAt, serverUpdatedAt } = ctx;

  // ---- 1. Server-authoritative fields ------------------------------------

  if (tableName === 'profiles') {
    // If the server has changed kyc_status or is_verified and the local copy
    // differs, the server always wins for those fields.  We still want to
    // keep other local edits (e.g. preferred_language), so we use 'merge'.
    const serverKyc = serverRecord['kyc_status'];
    const localKyc = localRecord['kyc_status'];
    const serverVerified = serverRecord['is_verified'];
    const localVerified = localRecord['is_verified'];

    if (serverKyc !== localKyc || serverVerified !== localVerified) {
      // Server wins on the authoritative fields; merge for everything else
      return 'merge';
    }
  }

  if (tableName === 'payments') {
    // Payment status is owned by the payment gateway / server workflow.
    // Always let the server's status win.
    const serverStatus = serverRecord['payment_status'];
    const localStatus = localRecord['payment_status'];

    if (serverStatus !== localStatus) {
      return 'server_wins';
    }
  }

  // ---- 2. Client wins for submitted tickets overwriting server draft ------

  if (tableName === 'collection_tickets') {
    const localStatus = localRecord['status'];
    const serverStatus = serverRecord['status'];

    if (localStatus === 'submitted' && serverStatus === 'draft') {
      return 'client_wins';
    }
  }

  // ---- 3. Last-write-wins for: routes, route_stops, clusters, reelers ----

  const lwwTables = new Set(['routes', 'route_stops', 'clusters', 'reelers']);
  if (lwwTables.has(tableName)) {
    return localUpdatedAt >= serverUpdatedAt ? 'client_wins' : 'server_wins';
  }

  // ---- 4. Default: last-write-wins for any remaining tables ---------------

  return localUpdatedAt >= serverUpdatedAt ? 'client_wins' : 'server_wins';
}

// ---------------------------------------------------------------------------
// mergeRecords
// ---------------------------------------------------------------------------

/**
 * Produce a merged record given a resolution strategy.
 *
 * - 'server_wins': return server record verbatim.
 * - 'client_wins': return client record verbatim.
 * - 'merge':       start from the server record (newer or authoritative base)
 *   and layer in client fields that the server should NOT override:
 *     - profiles: server wins on kyc_status, is_verified; client wins on
 *       preferred_language, employee_id, last_active_at
 *     - collection_tickets: server wins on status, sync_status; client wins
 *       on all measurement / GPS / notes fields
 *   For tables not explicitly handled, merge falls back to server_wins.
 *
 * The returned record uses WatermelonDB field names (snake_case as defined
 * in the schema).
 */
export function mergeRecords(
  ctx: ConflictContext & { resolution: ConflictResolution },
): Record<string, unknown> {
  const { tableName, localRecord, serverRecord, resolution } = ctx;

  if (resolution === 'server_wins') {
    return { ...serverRecord };
  }

  if (resolution === 'client_wins') {
    return { ...localRecord };
  }

  // resolution === 'merge' ------------------------------------------------

  switch (tableName) {
    case 'profiles': {
      // Base: server record (has authoritative kyc / verification state)
      const merged: Record<string, unknown> = { ...serverRecord };

      // Client-owned fields: user preferences and activity timestamp
      merged['preferred_language'] = localRecord['preferred_language'];
      merged['employee_id'] = localRecord['employee_id'];
      // Keep whichever last_active_at is more recent
      const localActive = (localRecord['last_active_at'] as number | null) ?? 0;
      const serverActive = (serverRecord['last_active_at'] as number | null) ?? 0;
      merged['last_active_at'] = Math.max(localActive, serverActive) || null;

      // Always keep server values for authoritative fields
      merged['kyc_status'] = serverRecord['kyc_status'];
      merged['is_verified'] = serverRecord['is_verified'];

      return merged;
    }

    case 'collection_tickets': {
      // Base: client record (collector's measurements are source of truth)
      const merged: Record<string, unknown> = { ...localRecord };

      // Server wins on lifecycle / financial fields
      merged['status'] = serverRecord['status'];
      merged['sync_status'] = serverRecord['sync_status'];
      merged['ticket_number'] = serverRecord['ticket_number'];
      merged['price_per_kg'] = serverRecord['price_per_kg'];
      merged['total_amount'] = serverRecord['total_amount'];
      merged['price_list_id'] = serverRecord['price_list_id'];
      merged['pricing_snapshot'] = serverRecord['pricing_snapshot'];

      return merged;
    }

    case 'reelers': {
      // Base: server record (bank/payment info managed server-side)
      const merged: Record<string, unknown> = { ...serverRecord };

      // Client can update local annotations / totals it is responsible for
      // (These are aggregated on the server, but we keep the higher value)
      const localCollections = (localRecord['total_collections'] as number) ?? 0;
      const serverCollections = (serverRecord['total_collections'] as number) ?? 0;
      merged['total_collections'] = Math.max(localCollections, serverCollections);

      const localEarnings = (localRecord['total_earnings_inr'] as number) ?? 0;
      const serverEarnings = (serverRecord['total_earnings_inr'] as number) ?? 0;
      merged['total_earnings_inr'] = Math.max(localEarnings, serverEarnings);

      return merged;
    }

    case 'routes': {
      // Base: server
      const merged: Record<string, unknown> = { ...serverRecord };

      // Collector updates completed_stops and actual weight locally
      const localCompleted = (localRecord['completed_stops'] as number) ?? 0;
      const serverCompleted = (serverRecord['completed_stops'] as number) ?? 0;
      merged['completed_stops'] = Math.max(localCompleted, serverCompleted);

      if (localRecord['actual_total_weight_kg'] != null) {
        merged['actual_total_weight_kg'] = localRecord['actual_total_weight_kg'];
      }

      return merged;
    }

    case 'route_stops': {
      // Base: server
      const merged: Record<string, unknown> = { ...serverRecord };

      // Client captures arrival time, notes, and links the ticket
      if (localRecord['actual_arrival_time'] != null) {
        merged['actual_arrival_time'] = localRecord['actual_arrival_time'];
      }
      if (localRecord['collection_ticket_id'] != null) {
        merged['collection_ticket_id'] = localRecord['collection_ticket_id'];
      }
      if (localRecord['collector_notes'] != null) {
        merged['collector_notes'] = localRecord['collector_notes'];
      }
      if (localRecord['skip_reason'] != null) {
        merged['skip_reason'] = localRecord['skip_reason'];
      }
      // Status: server wins unless client has a more advanced status
      const statusOrder: Record<string, number> = {
        pending: 0,
        in_progress: 1,
        completed: 2,
        skipped: 2,
      };
      const localStatusRank =
        statusOrder[localRecord['status'] as string] ?? 0;
      const serverStatusRank =
        statusOrder[serverRecord['status'] as string] ?? 0;
      merged['status'] = localStatusRank > serverStatusRank
        ? localRecord['status']
        : serverRecord['status'];

      return merged;
    }

    default:
      // Fallback: server wins
      return { ...serverRecord };
  }
}

// ---------------------------------------------------------------------------
// Convenience: apply conflict resolution in one call
// ---------------------------------------------------------------------------

/**
 * Resolve a conflict and return the final record that should be persisted.
 * Combines resolveConflict + mergeRecords into a single call.
 */
export function applyConflictResolution(ctx: ConflictContext): Record<string, unknown> {
  const resolution = resolveConflict(ctx);
  return mergeRecords({ ...ctx, resolution });
}
