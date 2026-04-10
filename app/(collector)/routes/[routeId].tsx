import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@/hooks/useRoute';
import StopItem from '@/components/collector/StopItem';
import RouteStopModel from '@/models/RouteStopModel';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const PROGRESS_FILL = '#111111';
const PROGRESS_BG = '#E5E5E5';

export default function RouteDetail() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const { currentRoute, stops, selectRoute, progress } = useRoute();

  useEffect(() => {
    if (routeId) selectRoute(routeId);
  }, [routeId, selectRoute]);

  const renderStop = useCallback(
    ({ item }: { item: RouteStopModel }) => (
      <StopItem
        stopNumber={item.stopOrder}
        reelerName={item.reelerId}
        status={item.status as 'pending' | 'done' | 'skipped' | 'visited'}
        expectedQty={item.expectedWeightKg}
        onPress={() => router.push('/(collector)/ticket/new')}
        onNavigate={() => {}}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: RouteStopModel) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {currentRoute?.name ?? 'Route'}
        </Text>
      </View>

      {/* Progress row */}
      <View style={styles.progressBlock}>
        <Text style={styles.progressText}>
          {progress.completedStops} of {progress.totalStops} stops
        </Text>
        <View style={styles.progressBg}>
          <View
            style={[styles.progressFill, { width: `${progress.percentComplete}%` }]}
          />
        </View>
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>STOPS</Text>

      <FlatList
        data={stops}
        keyExtractor={keyExtractor}
        renderItem={renderStop}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stops on this route</Text>
          </View>
        }
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    flex: 1,
  },
  progressBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  progressText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  progressBg: {
    height: 6,
    backgroundColor: PROGRESS_BG,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PROGRESS_FILL,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
});
