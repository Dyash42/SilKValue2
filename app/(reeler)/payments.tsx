import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '@/hooks/useSync';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency, formatDate } from '@/utils/format';
import type { PaymentRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'completed' | 'pending' | 'processing' | 'failed';
type DateFilter = 'all' | 'week' | 'month' | '3months';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: '3months', label: 'Last 3 Months' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusStyle(s: string | null) {
  if (s === 'completed') return { bg: C.greenBg, text: C.greenText, label: 'PAID' };
  if (s === 'pending') return { bg: C.amberBg, text: C.amberText, label: 'PENDING' };
  if (s === 'processing') return { bg: C.blueBg, text: C.blueText, label: 'PROCESSING' };
  if (s === 'failed') return { bg: C.redBg, text: C.redText, label: 'FAILED' };
  return { bg: C.surfaceAlt, text: C.textSecondary, label: (s ?? 'UNKNOWN').toUpperCase() };
}

function filterByDate(p: PaymentRow, df: DateFilter): boolean {
  if (df === 'all') return true;
  const d = p.initiated_at ? new Date(p.initiated_at) : null;
  if (!d) return false;
  const now = new Date();
  if (df === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7); return d >= start;
  }
  if (df === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  if (df === '3months') {
    const start = new Date(now); start.setMonth(now.getMonth() - 3); return d >= start;
  }
  return true;
}

// ── Payment row ───────────────────────────────────────────────────────────────

function PaymentRow({ payment }: { payment: PaymentRow }) {
  const ss = statusStyle(payment.payment_status ?? null);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        router.push({ pathname: '/(reeler)/payment-detail', params: { paymentId: payment.id } })
      }
      activeOpacity={0.78}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowAmount}>{formatCurrency(payment.amount ?? 0)}</Text>
        <Text style={styles.rowMeta}>
          {formatDate(payment.initiated_at)} ·{' '}
          {(payment.payment_mode ?? '').replace(/_/g, ' ').toUpperCase() || '—'}
        </Text>
        {payment.transaction_reference ? (
          <Text style={styles.rowRef}>REF: {payment.transaction_reference}</Text>
        ) : null}
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: ss.bg }]}>
          <Text style={[styles.badgeText, { color: ss.text }]}>{ss.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const { user, profile } = useAuthStore();
  const { isSyncing, pendingCount, error: syncError, triggerSync } = useSync();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const reelerId = profile?.id ?? user?.id ?? null;

  const fetchPayments = useCallback(async (silent = false) => {
    if (!reelerId) { setIsLoading(false); return; }
    if (!silent) setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('reeler_id', reelerId)
        .order('initiated_at', { ascending: false });
      if (error) throw new Error(error.message);
      setPayments((data ?? []) as PaymentRow[]);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load payments.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [reelerId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPayments(true);
    triggerSync();
  }, [fetchPayments, triggerSync]);

  const filtered = useMemo(() => {
    let list = payments;
    if (statusFilter !== 'all') list = list.filter((p) => p.payment_status === statusFilter);
    list = list.filter((p) => filterByDate(p, dateFilter));
    return list;
  }, [payments, statusFilter, dateFilter]);

  // Summary stats
  const totalPaid = payments
    .filter((p) => p.payment_status === 'completed')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments
    .filter((p) => p.payment_status === 'pending' || p.payment_status === 'processing')
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><Text style={styles.title}>Payments</Text></View>
        <View style={styles.centered}><ActivityIndicator size="large" color={C.black} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
      </View>

      <SyncStatusBar
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        error={syncError}
        onSync={triggerSync}
        onRetry={triggerSync}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentRow payment={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={C.black} />
        }
        ListHeaderComponent={
          <View>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: C.black, flex: 1 }]}>
                <Text style={styles.summaryLabel}>TOTAL PAID</Text>
                <Text style={[styles.summaryValue, { color: C.white }]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: C.amberBg, flex: 1 }]}>
                <Text style={[styles.summaryLabel, { color: C.amberText }]}>PENDING</Text>
                <Text style={[styles.summaryValue, { color: C.amberText }]}>
                  {formatCurrency(totalPending)}
                </Text>
              </View>
            </View>

            {/* Date filter chips */}
            <View style={styles.chipRow}>
              {DATE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, dateFilter === f.key && styles.chipActive]}
                  onPress={() => setDateFilter(f.key)}
                >
                  <Text style={[styles.chipText, dateFilter === f.key && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status filter chips */}
            <View style={styles.chipRow}>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, statusFilter === f.key && styles.chipActive]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {fetchError ? (
              <TouchableOpacity style={styles.errorBanner} onPress={() => fetchPayments()}>
                <Ionicons name="alert-circle-outline" size={14} color={C.redText} />
                <Text style={styles.errorText}>{fetchError} — tap to retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="💳"
            title="No payments found"
            subtitle={
              statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Your payment history will appear here.'
            }
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Withdraw FAB */}
      <TouchableOpacity
        style={styles.withdrawBtn}
        onPress={() => router.push('/(reeler)/withdrawal')}
        activeOpacity={0.88}
      >
        <Ionicons name="arrow-up-circle-outline" size={18} color={C.white} />
        <Text style={styles.withdrawBtnText}>Withdraw</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  summaryRow: { flexDirection: 'row', gap: S.sm, padding: S.base },
  summaryCard: { borderRadius: R.lg, padding: S.md },
  summaryLabel: {
    fontSize: T.xs,
    fontWeight: T.bold,
    color: C.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: { fontSize: T['4xl'], fontWeight: T.extrabold },

  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: S.base,
    paddingBottom: S.xs,
    gap: S.xs,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipText: { fontSize: T.base, color: C.textSecondary, fontWeight: T.medium },
  chipTextActive: { color: C.white },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    marginHorizontal: S.base,
    marginBottom: S.sm,
    padding: S.sm,
    backgroundColor: C.redBg,
    borderRadius: R.md,
  },
  errorText: { fontSize: T.base, color: C.redText, flex: 1 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLeft: { flex: 1, gap: 4 },
  rowAmount: { fontSize: T['2xl'], fontWeight: T.extrabold, color: C.textPrimary },
  rowMeta: { fontSize: T.base, color: C.textSecondary },
  rowRef: { fontSize: T.xs, color: C.textMuted, letterSpacing: 0.3 },
  rowRight: { alignItems: 'flex-end', marginLeft: S.sm },

  badge: { borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 3 },
  badgeText: { fontSize: T.xs, fontWeight: T.bold, letterSpacing: 0.5 },

  listContent: { flexGrow: 1, paddingBottom: 80 },

  withdrawBtn: {
    position: 'absolute',
    bottom: 20,
    left: S.base,
    right: S.base,
    backgroundColor: C.black,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: S.sm,
    elevation: 4,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  withdrawBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
