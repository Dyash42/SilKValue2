/**
 * engine.ts
 *
 * Main sync orchestrator for the Silk Value offline-first sync engine.
 *
 * Responsibilities:
 *  - Drive WatermelonDB's synchronize() with the custom pull/push handlers
 *  - Prevent concurrent syncs via a mutex flag
 *  - Retry failed syncs with exponential backoff
 *  - Expose background sync (interval-based) with a clean-up function
 *  - Emit sync progress events via a lightweight EventEmitter
 *  - Track pending (unsynced) collection_tickets count
 */

import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import { EventEmitter } from 'events';

import { database } from '../watermelon/database';
import { pullChanges } from './pullChanges';
import { pushChanges } from './pushChanges';
import { Config } from '../../constants/config';
import { SCHEMA_VERSION } from '../watermelon/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  pullCount: number;
  pushCount: number;
  errors: string[];
  durationMs: number;
}

export type SyncEventType =
  | 'sync:start'
  | 'sync:pull_complete'
  | 'sync:push_complete'
  | 'sync:success'
  | 'sync:error'
  | 'sync:retry';

export interface SyncProgressEvent {
  type: SyncEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** Singleton EventEmitter for sync progress events. */
export const syncEvents = new EventEmitter();
syncEvents.setMaxListeners(20);

/** Mutex: prevents concurrent syncs. */
let _isSyncing = false;

/** AbortController for cancelling in-flight sync. */
let _syncAbortController: AbortController | null = null;

/** Backoff delays in ms for consecutive failures. */
const BACKOFF_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000];

// ---------------------------------------------------------------------------
// Event helpers
// ---------------------------------------------------------------------------

function emit(type: SyncEventType, data?: Record<string, unknown>): void {
  const event: SyncProgressEvent = { type, timestamp: Date.now(), data };
  syncEvents.emit(type, event);
  syncEvents.emit('*', event); // wildcard listener support
}

// ---------------------------------------------------------------------------
// Subscribe / unsubscribe helpers (convenience wrappers)
// ---------------------------------------------------------------------------

export function onSyncEvent(
  type: SyncEventType | '*',
  handler: (event: SyncProgressEvent) => void,
): () => void {
  syncEvents.on(type, handler);
  return () => syncEvents.off(type, handler);
}

// ---------------------------------------------------------------------------
// Pending count
// ---------------------------------------------------------------------------

/**
 * Returns the number of collection_tickets with sync_status not equal to
 * 'synced' (i.e., 'pending', 'failed', or any other queued state).
 */
export async function getPendingCount(): Promise<number> {
  try {
    const ticketsCollection = database.get('collection_tickets');
    const pending = await ticketsCollection
      .query(Q.where('sync_status', Q.notEq('synced')))
      .fetchCount();
    return pending;
  } catch (err) {
    console.error('[SyncEngine] getPendingCount error:', err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Pull/push record counters (extracted from WDB sync result)
// ---------------------------------------------------------------------------

/**
 * WatermelonDB's synchronize() does not return counts directly, so we wrap
 * the pull/push handlers to intercept and count records.
 */
interface SyncCounters {
  pullCount: number;
  pushCount: number;
}

function makeInstrumentedHandlers(counters: SyncCounters) {
  const instrumentedPull: typeof pullChanges = async (args) => {
    const result = await pullChanges(args);
    let count = 0;
    for (const tableChanges of Object.values(result.changes)) {
      count +=
        tableChanges.created.length +
        tableChanges.updated.length +
        tableChanges.deleted.length;
    }
    counters.pullCount = count;
    emit('sync:pull_complete', { pullCount: count });
    return result;
  };

  const instrumentedPush: typeof pushChanges = async (args) => {
    let count = 0;
    for (const tableChanges of Object.values(args.changes)) {
      count +=
        tableChanges.created.length +
        tableChanges.updated.length +
        tableChanges.deleted.length;
    }
    counters.pushCount = count;
    await pushChanges(args);
    emit('sync:push_complete', { pushCount: count });
  };

  return { instrumentedPull, instrumentedPush };
}

// ---------------------------------------------------------------------------
// Core sync execution (single attempt)
// ---------------------------------------------------------------------------

async function executeSyncOnce(
  signal: AbortSignal,
): Promise<Omit<SyncResult, 'durationMs'>> {
  const errors: string[] = [];
  const counters: SyncCounters = { pullCount: 0, pushCount: 0 };
  const { instrumentedPull, instrumentedPush } = makeInstrumentedHandlers(counters);

  try {
    if (signal.aborted) {
      throw new Error('Sync cancelled before start');
    }

    await synchronize({
      database,
      migrationsEnabledAtVersion: SCHEMA_VERSION,
      pullChanges: instrumentedPull,
      pushChanges: instrumentedPush,
      // WatermelonDB sends the lastPulledAt stored in its metadata table.
      // We pass it through unchanged.
    });

    return {
      success: true,
      pullCount: counters.pullCount,
      pushCount: counters.pushCount,
      errors,
    };
  } catch (err) {
    if (signal.aborted) {
      return { success: false, pullCount: 0, pushCount: 0, errors: ['Sync cancelled'] };
    }
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    console.error('[SyncEngine] Sync attempt failed:', msg);
    return {
      success: false,
      pullCount: counters.pullCount,
      pushCount: counters.pushCount,
      errors,
    };
  }
}

// ---------------------------------------------------------------------------
// runSync — main exported function
// ---------------------------------------------------------------------------

/**
 * Run a full sync cycle (pull + push).
 *
 * - If a sync is already in progress, returns immediately with an error result.
 * - On failure, retries with exponential backoff up to BACKOFF_DELAYS_MS.length
 *   additional attempts.
 * - Emits sync:start, sync:success / sync:error events.
 */
export async function runSync(): Promise<SyncResult> {
  if (_isSyncing) {
    console.warn('[SyncEngine] Sync already in progress — skipping');
    return {
      success: false,
      pullCount: 0,
      pushCount: 0,
      errors: ['Sync already in progress'],
      durationMs: 0,
    };
  }

  _isSyncing = true;
  _syncAbortController = new AbortController();
  const { signal } = _syncAbortController;

  const startMs = Date.now();
  emit('sync:start', { startedAt: startMs });

  let lastResult: Omit<SyncResult, 'durationMs'> = {
    success: false,
    pullCount: 0,
    pushCount: 0,
    errors: [],
  };

  try {
    // First attempt
    lastResult = await executeSyncOnce(signal);

    // Retry loop on failure
    if (!lastResult.success && !signal.aborted) {
      for (let i = 0; i < BACKOFF_DELAYS_MS.length; i++) {
        const delay = BACKOFF_DELAYS_MS[i];
        console.warn(
          `[SyncEngine] Retrying sync (attempt ${i + 2}/${BACKOFF_DELAYS_MS.length + 1}) after ${delay}ms`,
        );
        emit('sync:retry', { attempt: i + 2, delayMs: delay });

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, delay);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Sync cancelled during backoff'));
          });
        }).catch(() => {
          // aborted during backoff — break out of retry loop
        });

        if (signal.aborted) break;

        lastResult = await executeSyncOnce(signal);
        if (lastResult.success) break;
      }
    }

    const durationMs = Date.now() - startMs;

    if (lastResult.success) {
      emit('sync:success', {
        pullCount: lastResult.pullCount,
        pushCount: lastResult.pushCount,
        durationMs,
      });
    } else {
      emit('sync:error', { errors: lastResult.errors, durationMs });
    }

    return { ...lastResult, durationMs };
  } finally {
    _isSyncing = false;
    _syncAbortController = null;
  }
}

// ---------------------------------------------------------------------------
// cancelSync
// ---------------------------------------------------------------------------

/**
 * Abort any currently-running sync.
 * Safe to call when no sync is in progress (no-op).
 */
export function cancelSync(): void {
  if (_syncAbortController) {
    console.info('[SyncEngine] Cancelling in-flight sync');
    _syncAbortController.abort();
  }
}

// ---------------------------------------------------------------------------
// startBackgroundSync
// ---------------------------------------------------------------------------

/**
 * Start an interval-based background sync.
 *
 * - Fires an immediate sync, then repeats every `intervalMs`.
 * - Returns a cleanup function that stops the interval when called.
 * - Skips a tick if a sync is already running.
 *
 * @param intervalMs  How often to sync (default: Config.sync.intervalMs = 30s)
 */
export function startBackgroundSync(
  intervalMs: number = Config.sync.intervalMs,
): () => void {
  let stopped = false;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  // Run immediately on start, then on each interval tick
  const tick = async (): Promise<void> => {
    if (stopped) return;
    try {
      await runSync();
    } catch (err) {
      // runSync itself never throws — this is a safety net
      console.error('[SyncEngine] Unexpected error in background sync tick:', err);
    }
  };

  // Kick off first sync without waiting for the first interval
  void tick();

  intervalHandle = setInterval(() => {
    void tick();
  }, intervalMs);

  // Return cleanup function
  return () => {
    stopped = true;
    if (intervalHandle !== null) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    cancelSync();
    console.info('[SyncEngine] Background sync stopped');
  };
}
