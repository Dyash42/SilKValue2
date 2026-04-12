import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { getTodayEntries } from '@/services/gate.service';
import GateEntryItem from '@/components/gate/GateEntryItem';
import EmptyState from '@/components/shared/EmptyState';
import type { GateEntryRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

type Filter = 'all' | 'today' | 'week' | 'passed' | 'rejected' | 'overrides';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'passed', label: 'Passed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'overrides', label: 'Overrides' },
];

export default function HistoryScreen() {
  const { profile } = useAuth();
  const { isSyncing, triggerSync } = useSync();
  const [entries, setEntries] = useState<GateEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('today');

  const loadEntries = useCallback(async () => {
    if (!profile?.user_id) return;
    setIsLoading(true);
    try {
      const data = await getTodayEntries(profile.user_id);
      setEntries(data);
    } catch { /* silent */ } finally { setIsLoading(false); }
  }, [profile?.user_id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const onRefresh = useCallback(async () => {
    await triggerSync();
    await loadEntries();
  }, [triggerSync, loadEntries]);

  const filtered = entries.filter(e => {
    if (filter === 'passed') return e.qc_status === 'accepted';
    if (filter === 'rejected') return e.qc_status === 'rejected';
    if (filter === 'overrides') return e.override_status != null && e.override_status !== 'none';
    return true; // 'all', 'today', 'week' — all show today's entries for now
  });

  const renderEntry = useCallback(
    ({ item }: { item: GateEntryRow }) => (
      <GateEntryItem
        entry={item}
        onPress={() => router.push(`/(gate)/history/${item.id}`)}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gate History</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        refreshControl={<RefreshControl refreshing={isSyncing || isLoading} onRefresh={onRefresh} tintColor={C.black} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="📋" title="No entries match your filter" subtitle="Try a different filter, or pull down to refresh." />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.base, paddingTop: S.base, paddingBottom: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: S.sm,
    paddingHorizontal: S.base, paddingVertical: S.md,
  },
  chip: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.full,
    paddingHorizontal: S.base, paddingVertical: 6,
  },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipText: { fontSize: T.base, fontWeight: T.semibold, color: C.textSecondary },
  chipTextActive: { color: C.white },
  listContent: { padding: S.base, paddingBottom: 40, flexGrow: 1 },
});
