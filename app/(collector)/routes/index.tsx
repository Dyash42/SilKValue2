import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRoute } from '@/hooks/useRoute';
import { useSync } from '@/hooks/useSync';
import RouteCard from '@/components/collector/RouteCard';
import EmptyState from '@/components/shared/EmptyState';
import RouteModel from '@/models/RouteModel';
import { formatDate } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

type Filter = 'all' | 'today' | 'completed';

export default function RoutesIndex() {
  const { routes, isLoading } = useRoute();
  const { isSyncing, triggerSync } = useSync();
  const [filter, setFilter] = useState<Filter>('today');

  const onRefresh = useCallback(async () => { await triggerSync(); }, [triggerSync]);

  const today = new Date().toDateString();
  const filtered = routes.filter((r) => {
    if (filter === 'today') return r.date.toDateString() === today;
    if (filter === 'completed') return r.status === 'completed';
    return true;
  });

  const renderRoute = useCallback(
    ({ item }: { item: RouteModel }) => (
      <RouteCard
        routeName={item.name}
        cluster={item.clusterId}
        totalStops={item.totalStops}
        completedStops={item.completedStops}
        date={formatDate(item.date)}
        isActive={item.status === 'in_progress'}
        onPress={() => router.push(`/(collector)/routes/${item.id}`)}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routes</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {(['all', 'today', 'completed'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderRoute}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={C.black} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🗺️"
              title="No routes assigned"
              subtitle="Routes assigned by your supervisor will appear here."
            />
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
  chipRow: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.base, paddingVertical: S.md },
  chip: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.full,
    paddingHorizontal: S.base, paddingVertical: 6,
  },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipText: { fontSize: T.base, fontWeight: T.semibold, color: C.textSecondary },
  chipTextActive: { color: C.white },
  listContent: { padding: S.base, paddingBottom: 40, flexGrow: 1 },
});
