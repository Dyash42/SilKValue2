import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRoute } from '@/hooks/useRoute';
import { useSync } from '@/hooks/useSync';
import RouteCard from '@/components/collector/RouteCard';
import EmptyState from '@/components/shared/EmptyState';
import RouteModel from '@/models/RouteModel';
import { formatDate } from '@/utils/format';

// Design system colors
const BG = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';

export default function RoutesIndex() {
  const { routes, isLoading } = useRoute();
  const { isSyncing, triggerSync } = useSync();

  const onRefresh = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

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

  const keyExtractor = useCallback((item: RouteModel) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routes</Text>
      </View>

      <FlatList
        data={routes}
        keyExtractor={keyExtractor}
        renderItem={renderRoute}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor="#000" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🗺️"
              title="No routes assigned"
              subtitle="Your routes will appear here once assigned by your supervisor."
            />
          ) : null
        }
        ItemSeparatorComponent={() => null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
});
