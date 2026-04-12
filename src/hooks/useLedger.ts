/**
 * useLedger.ts — Silk Value Platform
 *
 * React hook that fetches a reeler's ledger entries and summary from Supabase.
 * Designed for the Reeler app screens (earnings, payments, dashboard).
 *
 * Pattern mirrors useSync / useRoute — local state + manual refresh trigger.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getLedgerEntries,
  getLedgerSummary,
  type LedgerSummary,
} from '@/services/ledger.service';
import type { ReelerLedgerRow } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseLedgerResult {
  /** Ledger entries, newest first (up to the fetch limit). */
  entries: ReelerLedgerRow[];
  /** Aggregated balance/totals. Null while first load is in progress. */
  summary: LedgerSummary | null;
  isLoading: boolean;
  /** Network / Supabase error message, or null if no error. */
  error: string | null;
  /** Manually re-fetch entries and summary. */
  refresh: () => void;
}

const DEFAULT_SUMMARY: LedgerSummary = {
  balance: 0,
  totalCredited: 0,
  totalDebited: 0,
  entryCount: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param reelerId  profiles.id / reelers.id of the reeler.
 *                  Pass null while the profile is still loading — the hook
 *                  will not fetch and will return isLoading=false, summary=null.
 * @param limit     Maximum number of entries to fetch (default 50).
 */
export function useLedger(
  reelerId: string | null,
  limit = 50,
): UseLedgerResult {
  const [entries, setEntries]   = useState<ReelerLedgerRow[]>([]);
  const [summary, setSummary]   = useState<LedgerSummary | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [tick, setTick]         = useState(0); // increment to force refresh

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!reelerId) {
      setEntries([]);
      setSummary(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getLedgerEntries(reelerId, limit),
      getLedgerSummary(reelerId),
    ])
      .then(([rows, sum]) => {
        if (cancelled) return;
        setEntries(rows);
        setSummary(sum);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load ledger';
        setError(msg);
        // Keep stale data on error so UI doesn't blank out
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [reelerId, limit, tick]);

  return {
    entries,
    summary: summary ?? (reelerId ? null : DEFAULT_SUMMARY),
    isLoading,
    error,
    refresh,
  };
}
