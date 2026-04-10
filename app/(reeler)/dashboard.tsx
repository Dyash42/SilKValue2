import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import EarningCard from '@/components/reeler/EarningCard';
import CollectionHistoryItem from '@/components/reeler/CollectionHistoryItem';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import { formatDate } from '@/utils/format';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const AMBER = '#F59E0B';
const GREEN = '#22C55E';

export default function ReelerDashboard() {
  const { profile } = useAuth();
  const { isSyncing, pendingCount, error, triggerSync } = useSync();
  const { pendingTickets } = useCollectionTicket();

  const onRefresh = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

  const userName = profile?.full_name ?? 'Reeler';

  // Earnings
  const now = new Date();
  const thisMonthEarnings = pendingTickets.reduce((sum, t) => {
    const d = t.collectionTimestamp;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return sum + t.totalAmount;
    }
    return sum;
  }, 0);
  const pendingPayments = pendingTickets
    .filter((t) => t.status !== 'paid')
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalEarnings = pendingTickets.reduce((s, t) => s + t.totalAmount, 0);

  const recentTickets = pendingTickets.slice(0, 10);

  const renderItem = useCallback(
    ({ item }: { item: CollectionTicketModel }) => (
      <CollectionHistoryItem
        date={formatDate(item.collectionTimestamp)}
        ticketNumber={item.ticketNumber}
        grade={item.qualityGrade}
        weightKg={item.netWeightKg}
        amountInr={item.totalAmount}
        onPress={() => router.push('/(reeler)/collections')}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: CollectionTicketModel) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Silk Value</Text>
        <View style={styles.topBarRight}>
          <Text style={styles.userName}>{userName}</Text>
          <View
            style={[
              styles.syncDot,
              { backgroundColor: isSyncing ? AMBER : GREEN },
            ]}
          />
          <Text style={styles.syncLabel}>{isSyncing ? 'SYNCING' : 'SYNCED'}</Text>
        </View>
      </View>

      {/* Sync status bar */}
      <SyncStatusBar
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        error={error}
        onSync={triggerSync}
        onRetry={triggerSync}
      />

      <FlatList
        data={recentTickets}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={BLACK} />
        }
        ListHeaderComponent={
          <View>
            {/* Earning card */}
            <EarningCard
              totalEarnings={totalEarnings}
              thisMonth={thisMonthEarnings}
              pending={pendingPayments}
            />

            {/* Section label */}
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>RECENT COLLECTIONS</Text>
            </View>

            {/* Column header */}
            {recentTickets.length > 0 && (
              <View style={styles.colHeaderRow}>
                <Text style={[styles.colHeader, { width: 56 }]}>DATE</Text>
                <Text style={[styles.colHeader, { flex: 1 }]}>TICKET</Text>
                <Text style={[styles.colHeader, { width: 36 }]}>GRD</Text>
                <Text style={[styles.colHeader, { width: 64, textAlign: 'right' }]}>WEIGHT</Text>
                <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>AMOUNT</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No collections yet"
            subtitle="Your silk cocoon collections will appear here."
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  listContent: { paddingBottom: 24 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT_PRIMARY,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },

  sectionLabelRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 6,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
