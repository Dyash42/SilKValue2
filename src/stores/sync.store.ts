import { create } from 'zustand';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface SyncStore {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingCount: number;
  error: string | null;
  consecutiveFailures: number;

  // Actions
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncedAt: (date: Date | null) => void;
  setPendingCount: (count: number) => void;
  setError: (error: string | null) => void;
  incrementFailures: () => void;
  resetFailures: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const syncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSyncedAt: null,
  pendingCount: 0,
  error: null,
  consecutiveFailures: 0,

  setSyncing: (isSyncing) => set(() => ({ isSyncing })),

  setLastSyncedAt: (lastSyncedAt) => set(() => ({ lastSyncedAt })),

  setPendingCount: (pendingCount) => set(() => ({ pendingCount })),

  setError: (error) => set(() => ({ error })),

  incrementFailures: () =>
    set((state) => ({ consecutiveFailures: state.consecutiveFailures + 1 })),

  resetFailures: () => set(() => ({ consecutiveFailures: 0 })),
}));

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Primary store hook. */
export const useSyncStore = syncStore;

/**
 * Typed selector hook.
 * Usage: const isSyncing = useSyncStoreSelector((s) => s.isSyncing);
 */
export const useSyncStoreSelector = <T>(selector: (state: SyncStore) => T): T =>
  syncStore(selector);
