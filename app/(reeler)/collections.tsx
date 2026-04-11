import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import { useSync } from '@/hooks/useSync';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import { formatDate, formatCurrency } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ── Constants ─────────────────────────────────────────────────────────────────

type DateFilter = 'all' | 'today' | 'week' | 'month';
type GradeFilter = 'A+' | 'A' | 'B' | 'C' | 'Reject';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const GRADE_FILTERS: GradeFilter[] = ['A+', 'A', 'B', 'C', 'Reject'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColor(grade: string) {
  if (grade === 'A+' || grade === 'A') return { border: C.greenText, text: C.greenText };
  if (grade === 'B') return { border: C.amberText, text: C.amberText };
  return { border: C.redText, text: C.redText };
}

function filterByDate(ticket: CollectionTicketModel, df: DateFilter): boolean {
  if (df === 'all') return true;
  const d = ticket.collectionTimestamp;
  const now = new Date();
  if (df === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (df === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  }
  if (df === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

// ── Collection row ────────────────────────────────────────────────────────────

function CollectionRow({ item }: { item: CollectionTicketModel }) {
  const gc = gradeColor(item.qualityGrade);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        router.push({ pathname: '/(reeler)/collection-detail', params: { ticketId: item.id } })
      }
      activeOpacity={0.78}
    >
      <Text style={[styles.cell, { width: 56 }]} numberOfLines={1}>
        {formatDate(item.collectionTimestamp).slice(0, 6)}
      </Text>
      <Text style={[styles.cellBold, { flex: 1 }]} numberOfLines={1}>
        {item.ticketNumber}
      </Text>
      <View style={[styles.gradePill, { borderColor: gc.border }]}>
        <Text style={[styles.gradeLabel, { color: gc.text }]}>{item.qualityGrade}</Text>
      </View>
      <Text style={[styles.cell, { width: 64, textAlign: 'right' }]}>
        {item.netWeightKg.toFixed(1)} kg
      </Text>
      <Text style={[styles.cellBold, { width: 80, textAlign: 'right' }]}>
        {formatCurrency(item.totalAmount)}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CollectionsScreen() {
  const { pendingTickets } = useCollectionTicket();
  const { isSyncing, pendingCount, error, triggerSync } = useSync();
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [gradeFilters, setGradeFilters] = useState<Set<GradeFilter>>(new Set());

  const toggleGrade = useCallback((g: GradeFilter) => {
    setGradeFilters((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = pendingTickets;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.qualityGrade.toLowerCase().includes(q),
      );
    }
    list = list.filter((t) => filterByDate(t, dateFilter));
    if (gradeFilters.size > 0) {
      list = list.filter((t) => gradeFilters.has(t.qualityGrade as GradeFilter));
    }
    return list;
  }, [pendingTickets, query, dateFilter, gradeFilters]);

  const renderItem = useCallback(({ item }: { item: CollectionTicketModel }) => (
    <CollectionRow item={item} />
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Collections</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      <SyncStatusBar
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        error={error}
        onSync={triggerSync}
        onRetry={triggerSync}
      />

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets…"
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
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

      {/* Grade filter chips */}
      <View style={styles.chipRow}>
        {GRADE_FILTERS.map((g) => {
          const active = gradeFilters.has(g);
          const gc = gradeColor(g);
          return (
            <TouchableOpacity
              key={g}
              style={[
                styles.chip,
                active && { backgroundColor: gc.border, borderColor: gc.border },
              ]}
              onPress={() => toggleGrade(g)}
            >
              <Text style={[styles.chipText, active && { color: C.white }]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Column headers */}
      <View style={styles.colHeaderRow}>
        <Text style={[styles.colHeader, { width: 56 }]}>DATE</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>TICKET</Text>
        <Text style={[styles.colHeader, { width: 36 }]}>GRD</Text>
        <Text style={[styles.colHeader, { width: 64, textAlign: 'right' }]}>WEIGHT</Text>
        <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>AMOUNT</Text>
        <View style={{ width: 18 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No collections found"
            subtitle={
              query || gradeFilters.size > 0 || dateFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Collections will appear here after your cocoons are collected.'
            }
          />
        }
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={triggerSync} tintColor={C.black} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary },
  count: { fontSize: T.base, color: C.textSecondary },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: R.md,
    marginHorizontal: S.base,
    marginTop: S.md,
    marginBottom: S.xs,
    paddingHorizontal: S.md,
    paddingVertical: 9,
    gap: S.sm,
  },
  searchInput: { flex: 1, fontSize: T.md, color: C.textPrimary, padding: 0 },

  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: S.base,
    paddingVertical: S.xs,
    gap: S.xs,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipText: { fontSize: T.base, color: C.textSecondary, fontWeight: T.medium },
  chipTextActive: { color: C.white },

  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    backgroundColor: C.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 6,
  },
  colHeader: {
    fontSize: T.xs,
    fontWeight: T.bold,
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 6,
  },
  cell: { fontSize: T.base, color: C.textSecondary },
  cellBold: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary },
  gradePill: {
    width: 36,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingVertical: 2,
    alignItems: 'center',
  },
  gradeLabel: { fontSize: T.xs, fontWeight: T.bold },

  listContent: { flexGrow: 1, paddingBottom: 32 },
});
