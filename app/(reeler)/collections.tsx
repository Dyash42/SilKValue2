import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import CollectionHistoryItem from '@/components/reeler/CollectionHistoryItem';
import EmptyState from '@/components/shared/EmptyState';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import { formatDate } from '@/utils/format';

// Design system colors
const BG = '#FFFFFF';
const BORDER = '#E5E5E5';
const SURFACE_ALT = '#F5F5F5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';

export default function CollectionsScreen() {
  const { pendingTickets } = useCollectionTicket();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return pendingTickets;
    const q = query.trim().toLowerCase();
    return pendingTickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.qualityGrade.toLowerCase().includes(q),
    );
  }, [pendingTickets, query]);

  const renderItem = useCallback(
    ({ item }: { item: CollectionTicketModel }) => (
      <CollectionHistoryItem
        date={formatDate(item.collectionTimestamp)}
        ticketNumber={item.ticketNumber}
        grade={item.qualityGrade}
        weightKg={item.netWeightKg}
        amountInr={item.totalAmount}
        onPress={() => {}}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: CollectionTicketModel) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>My Collections</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={TEXT_MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets…"
          placeholderTextColor={TEXT_MUTED}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {/* Column header */}
      <View style={styles.colHeaderRow}>
        <Text style={[styles.colHeader, { width: 56 }]}>DATE</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>TICKET</Text>
        <Text style={[styles.colHeader, { width: 36 }]}>GRD</Text>
        <Text style={[styles.colHeader, { width: 64, textAlign: 'right' }]}>WEIGHT</Text>
        <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>AMOUNT</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No collections found"
            subtitle={query ? 'Try a different search term.' : 'Collections will appear here after your cocoons are collected.'}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { marginRight: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
  count: { fontSize: 13, color: TEXT_SECONDARY },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
    padding: 0,
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: SURFACE_ALT,
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
  listContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});
