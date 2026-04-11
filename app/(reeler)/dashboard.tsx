import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import { formatCurrency, formatDate } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ── Helpers ──────────────────────────────────────────────────────────────────

function greeting(name: string): string {
  const h = new Date().getHours();
  const salut = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const first = name.split(' ')[0];
  return `${salut}, ${first}`;
}

function kycBannerText(status: string | null | undefined): string | null {
  if (!status || status === 'verified') return null;
  if (status === 'submitted') return 'Your KYC documents are under review. Tap to check status.';
  if (status === 'rejected') return 'Your KYC was rejected. Tap to re-upload.';
  return 'Complete your KYC to unlock payments.';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EarningCard({
  total,
  thisMonth,
  pending,
}: {
  total: number;
  thisMonth: number;
  pending: number;
}) {
  return (
    <TouchableOpacity
      style={styles.earningCard}
      onPress={() => router.push('/(reeler)/earnings')}
      activeOpacity={0.88}
    >
      <Text style={styles.earningLabel}>TOTAL EARNINGS</Text>
      <Text style={styles.earningValue}>{formatCurrency(total)}</Text>
      <View style={styles.earningRow}>
        <View>
          <Text style={styles.earningSubLabel}>This Month</Text>
          <Text style={styles.earningSubValue}>{formatCurrency(thisMonth)}</Text>
        </View>
        <View style={styles.earningDivider} />
        <View>
          <Text style={styles.earningSubLabel}>Pending</Text>
          <Text style={[styles.earningSubValue, { color: C.amber }]}>
            {formatCurrency(pending)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={C.textMuted}
          style={{ marginLeft: 'auto' }}
        />
      </View>
    </TouchableOpacity>
  );
}

function CollectionCard({ ticket }: { ticket: CollectionTicketModel }) {
  const gradeColor =
    ticket.qualityGrade === 'A+' || ticket.qualityGrade === 'A'
      ? C.greenText
      : ticket.qualityGrade === 'B'
      ? C.amberText
      : C.redText;

  return (
    <TouchableOpacity
      style={styles.collCard}
      onPress={() =>
        router.push({ pathname: '/(reeler)/collection-detail', params: { ticketId: ticket.id } })
      }
      activeOpacity={0.82}
    >
      <View style={styles.collCardTop}>
        <Text style={styles.collTicket}>{ticket.ticketNumber}</Text>
        <View style={[styles.gradeBadge, { borderColor: gradeColor }]}>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{ticket.qualityGrade}</Text>
        </View>
      </View>
      <View style={styles.collCardBottom}>
        <Text style={styles.collDate}>{formatDate(ticket.collectionTimestamp)}</Text>
        <Text style={styles.collWeight}>{ticket.netWeightKg.toFixed(1)} kg</Text>
        <Text style={styles.collAmount}>{formatCurrency(ticket.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ReelerDashboard() {
  const { profile } = useAuth();
  const { isSyncing, pendingCount, error, triggerSync } = useSync();
  const { pendingTickets } = useCollectionTicket();

  const name = profile?.full_name ?? 'Reeler';
  const kycStatus = (profile as any)?.kyc_status ?? null;
  const kycBanner = kycBannerText(kycStatus);

  const onRefresh = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

  const now = new Date();
  const thisMonthEarnings = pendingTickets.reduce((sum, t) => {
    const d = t.collectionTimestamp;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      ? sum + t.totalAmount
      : sum;
  }, 0);
  const pendingPayments = pendingTickets
    .filter((t) => t.status !== 'paid')
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalEarnings = pendingTickets.reduce((s, t) => s + t.totalAmount, 0);

  const recentTickets = pendingTickets.slice(0, 5);

  const renderItem = useCallback(
    ({ item }: { item: CollectionTicketModel }) => <CollectionCard ticket={item} />,
    [],
  );

  const ListHeader = (
    <View>
      {/* Greeting */}
      <View style={styles.greetRow}>
        <Text style={styles.greetText}>{greeting(name)}</Text>
      </View>

      {/* KYC banner */}
      {kycBanner ? (
        <TouchableOpacity
          style={styles.kycBanner}
          onPress={() => router.push('/(reeler)/onboarding/kyc-pending')}
          activeOpacity={0.85}
        >
          <Ionicons name="alert-circle-outline" size={16} color={C.amberText} />
          <Text style={styles.kycBannerText}>{kycBanner}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.amberText} />
        </TouchableOpacity>
      ) : null}

      {/* Earnings card */}
      <View style={styles.section}>
        <EarningCard
          totalEarnings={totalEarnings}
          thisMonth={thisMonthEarnings}
          pending={pendingPayments}
          total={totalEarnings}
        />
      </View>

      {/* Recent collections header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT COLLECTIONS</Text>
        {pendingTickets.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(reeler)/collections')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Silk Value</Text>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push('/(reeler)/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={22} color={C.textPrimary} />
          {/* Unread badge — static placeholder; hook into real count when available */}
        </TouchableOpacity>
      </View>

      {/* Sync status */}
      <SyncStatusBar
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        error={error}
        onSync={triggerSync}
        onRetry={triggerSync}
      />

      <FlatList
        data={recentTickets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={C.black} />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No collections yet"
            subtitle="Your silk cocoon collections will appear here."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 32, flexGrow: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingTop: S.md,
    paddingBottom: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logo: { fontSize: T['3xl'], fontWeight: T.black, color: C.textPrimary },
  bellBtn: { padding: 4 },

  greetRow: { paddingHorizontal: S.base, paddingTop: S.lg, paddingBottom: S.sm },
  greetText: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },

  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginHorizontal: S.base,
    marginBottom: S.sm,
    backgroundColor: C.amberBg,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.amber,
  },
  kycBannerText: {
    flex: 1,
    fontSize: T.base,
    color: C.amberText,
    fontWeight: T.medium,
  },

  section: { paddingHorizontal: S.base, paddingBottom: S.base },

  earningCard: {
    backgroundColor: C.black,
    borderRadius: R.xl,
    padding: S.lg,
  },
  earningLabel: {
    fontSize: T.xs,
    fontWeight: T.bold,
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: S.xs,
  },
  earningValue: {
    fontSize: T['6xl'],
    fontWeight: T.extrabold,
    color: C.white,
    marginBottom: S.md,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.base,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: S.md,
  },
  earningSubLabel: {
    fontSize: T.xs,
    color: C.textMuted,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  earningSubValue: {
    fontSize: T.xl,
    fontWeight: T.bold,
    color: C.white,
  },
  earningDivider: { width: 1, height: 32, backgroundColor: '#333333' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
  },
  sectionTitle: {
    fontSize: T.xs,
    fontWeight: T.bold,
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLink: { fontSize: T.md, color: C.textSecondary, fontWeight: T.semibold },

  collCard: {
    marginHorizontal: S.base,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    padding: S.md,
    backgroundColor: C.white,
  },
  collCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  collTicket: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },
  gradeBadge: {
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gradeText: { fontSize: T.xs, fontWeight: T.bold },
  collCardBottom: { flexDirection: 'row', gap: S.base, alignItems: 'center' },
  collDate: { fontSize: T.base, color: C.textSecondary, flex: 1 },
  collWeight: { fontSize: T.base, color: C.textSecondary },
  collAmount: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },
});
