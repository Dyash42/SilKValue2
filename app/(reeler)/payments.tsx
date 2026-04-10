import React, { useEffect, useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency, formatDate } from '@/utils/format';
import type { PaymentRow } from '@/types';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const GREEN = '#22C55E';
const RED = '#EF4444';
const AMBER = '#F59E0B';

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string | null }) {
  let bg = SURFACE_ALT;
  let color = TEXT_SECONDARY;
  const label = (status ?? 'unknown').toUpperCase();

  if (status === 'completed') { bg = '#DCFCE7'; color = '#15803D'; }
  else if (status === 'pending') { bg = '#FEF3C7'; color = '#B45309'; }
  else if (status === 'failed') { bg = '#FEE2E2'; color = '#B91C1C'; }
  else if (status === 'processing') { bg = '#DBEAFE'; color = '#1D4ED8'; }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Payment card
// ---------------------------------------------------------------------------

function PaymentCard({ payment }: { payment: PaymentRow }) {
  return (
    <View style={styles.card}>
      {/* Top row: amount + status */}
      <View style={styles.cardTop}>
        <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
        <StatusBadge status={payment.payment_status ?? null} />
      </View>

      {/* Date + mode */}
      <View style={styles.cardMid}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={TEXT_MUTED} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{formatDate(payment.initiated_at)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="card-outline" size={13} color={TEXT_MUTED} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>
            {payment.payment_mode?.replace(/_/g, ' ').toUpperCase() ?? '—'}
          </Text>
        </View>
      </View>

      {/* Reference row (if present) */}
      {payment.transaction_reference ? (
        <View style={styles.refRow}>
          <Text style={styles.refLabel}>REF</Text>
          <Text style={styles.refValue}>{payment.transaction_reference}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({ total, count }: { total: number; count: number }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryLeft}>
        <Text style={styles.summaryLabel}>TOTAL PAID</Text>
        <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
      </View>
      <View style={styles.summaryRight}>
        <Text style={styles.summaryLabel}>PAYMENTS</Text>
        <Text style={styles.summaryCount}>{count}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={56} color={TEXT_MUTED} />
      <Text style={styles.emptyTitle}>No payments yet</Text>
      <Text style={styles.emptySubtitle}>Your payment history will appear here.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PaymentsScreen() {
  const { user, profile } = useAuthStore();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reelerId = profile?.id ?? user?.id ?? null;

  const fetchPayments = useCallback(
    async (silent = false) => {
      if (!reelerId) {
        setIsLoading(false);
        return;
      }
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await supabase
          .from('payments')
          .select('*')
          .eq('reeler_id', reelerId)
          .order('initiated_at', { ascending: false });

        if (fetchErr) throw new Error(fetchErr.message);
        setPayments((data ?? []) as PaymentRow[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load payments.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [reelerId],
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPayments(true);
  }, [fetchPayments]);

  // Derived totals (only completed)
  const totalPaid = payments
    .filter((p) => p.payment_status === 'completed')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payments</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BLACK} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payments</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_MUTED} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPayments()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentCard payment={item} />}
        contentContainerStyle={payments.length === 0 ? styles.flatListEmpty : styles.flatListContent}
        ListHeaderComponent={
          payments.length > 0 ? (
            <SummaryCard total={totalPaid} count={payments.length} />
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={BLACK}
            colors={[BLACK]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: TEXT_SECONDARY, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BLACK,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },

  flatListContent: { padding: 16, paddingBottom: 40 },
  flatListEmpty: { flex: 1 },

  // Summary card
  summaryCard: {
    backgroundColor: BLACK,
    borderRadius: 10,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLeft: {},
  summaryRight: { alignItems: 'flex-end' },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999999',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 26, fontWeight: '800', color: WHITE },
  summaryCount: { fontSize: 26, fontWeight: '800', color: WHITE },

  // Payment card
  card: {
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amount: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY },

  cardMid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: TEXT_SECONDARY },

  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 4,
  },
  refLabel: { fontSize: 10, fontWeight: '600', color: TEXT_MUTED, letterSpacing: 0.5 },
  refValue: { fontSize: 12, fontWeight: '600', color: TEXT_PRIMARY },

  // Badge
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center' },
});
