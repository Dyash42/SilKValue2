import { useEffect, useCallback } from 'react';

import { useSyncStore } from '@/stores/sync.store';
import { runSync, onSyncEvent, getPendingCount } from '@/lib/sync/engine';
import type { SyncProgressEvent } from '@/lib/sync/engine';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSync() {
  const {
    isSyncing,
    lastSyncedAt,
    pendingCount,
    error,
    setSyncing,
    setLastSyncedAt,
    setPendingCount,
    setError,
    incrementFailures,
    resetFailures,
  } = useSyncStore();

  // -------------------------------------------------------------------------
  // Subscribe to sync engine events
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Refresh pending count on mount so the UI shows accurate data immediately.
    getPendingCount()
      .then(setPendingCount)
      .catch((err: unknown) => {
        console.warn('[useSync] Failed to get initial pending count:', err);
      });

    // sync:start ——————————————————————————————————————————————————
    const unsubStart = onSyncEvent('sync:start', (_event: SyncProgressEvent) => {
      setSyncing(true);
    });

    // sync:success ————————————————————————————————————————————————
    const unsubSuccess = onSyncEvent('sync:success', (_event: SyncProgressEvent) => {
      setSyncing(false);
      setLastSyncedAt(new Date());
      resetFailures();
      setError(null);

      // Refresh pending count after a successful sync
      getPendingCount()
        .then(setPendingCount)
        .catch((err: unknown) => {
          console.warn('[useSync] Failed to refresh pending count after sync:', err);
        });
    });

    // sync:error ——————————————————————————————————————————————————
    const unsubError = onSyncEvent('sync:error', (event: SyncProgressEvent) => {
      setSyncing(false);

      const errors = event.data?.errors;
      const msg =
        Array.isArray(errors) && errors.length > 0
          ? String(errors[0])
          : 'Sync failed';

      setError(msg);
      incrementFailures();
    });

    return () => {
      unsubStart();
      unsubSuccess();
      unsubError();
    };
  }, [
    setSyncing,
    setLastSyncedAt,
    setPendingCount,
    setError,
    incrementFailures,
    resetFailures,
  ]);

  // -------------------------------------------------------------------------
  // triggerSync
  // -------------------------------------------------------------------------
  const triggerSync = useCallback(async (): Promise<void> => {
    try {
      await runSync();
    } catch (err: unknown) {
      // runSync itself never throws, but defensive catch just in case
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      incrementFailures();
    }
  }, [setError, incrementFailures]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    isSyncing,
    lastSyncedAt,
    pendingCount,
    error,
    triggerSync,
  } as const;
}
