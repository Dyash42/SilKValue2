import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import { useSync } from '@/hooks/useSync';
import EarningCard from '@/components/reeler/EarningCard';
import EmptyState from '@/components/shared/EmptyState';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import { formatDate } from '@/utils/format';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const RED = '#EF4444';

interface LedgerRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

function buildLedger(tickets: CollectionTicketModel[]): LedgerRow[] {
  return tickets.map((t) => ({
    id: t.id,
    date: formatDate(t.collectionTimestamp),
    description: `Ticket ${t.ticketNumber} · Grade ${t.qualityGrade}`,
    amount: t.totalAmount,
    type: 'credit' as const,
  }));
}

export default function EarningsScreen() {
  const { pendingTickets } = useCollectionTicket();
  const { isSyncing, triggerSync } = useSync();

  const onRefresh = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

  const now = new Date();
  const thisMonth = pendingTickets.reduce((s, t) => {
    const d = t.collectionTimestamp;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return s + t.totalAmount;
    }
    return s;
  }, 0);
  const pendingPayment = pendingTickets
    .filter((t) => t.status !== 'paid')
    .reduce((s, t) => s + t.totalAmount, 0);
  const total = pendingTickets.reduce((s, t) => s + t.totalAmount, 0);

  const ledger = buildLedger(pendingTickets);

  const renderRow = useCallback(
    ({ item }: { item: LedgerRow }) => (
      <View style={styles.ledgerRow}>
        <View style={styles.ledgerLeft}>
          <Text style={styles.ledgerDate}>{item.date}</Text>
          <Text style={styles.ledgerDesc} numberOfLines={1}>{item.description}</Text>
        </View>
        <Text style={[styles.ledgerAmount, item.type === 'debit' ? styles.debit : null]}>
          {item.type === 'credit' ? '+' : '-'}
          {'\u20B9'}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: LedgerRow) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Earnings</Text>
      </View>

      <FlatList
        data={ledger}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={BLACK} />
        }
        ListHeaderComponent={
          <View>
            <EarningCard totalEarnings={total} thisMonth={thisMonth} pending={pendingPayment} />
            <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="💰"
            title="No transactions yet"
            subtitle="Your payment transactions will appear here."
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY },
  listContent: { paddingBottom: 40, flexGrow: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  ledgerLeft: { flex: 1, marginRight: 12 },
  ledgerDate: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  ledgerDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  debit: {
    color: RED,
  },
});
