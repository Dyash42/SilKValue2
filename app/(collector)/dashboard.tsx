import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useRoute } from '@/hooks/useRoute';
import StopItem from '@/components/collector/StopItem';
import RouteStopModel from '@/models/RouteStopModel';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const AMBER = '#F59E0B';
const GREEN = '#22C55E';
const PROGRESS_FILL = '#111111';
const PROGRESS_BG = '#E5E5E5';

function SyncDot({ isSyncing }: { isSyncing: boolean }) {
  return (
    <View
      style={[
        styles.syncDot,
        { backgroundColor: isSyncing ? AMBER : GREEN },
      ]}
    />
  );
}

export default function CollectorDashboard() {
  const { profile } = useAuth();
  const { isSyncing, triggerSync } = useSync();
  const { routes, stops, selectRoute, currentRoute, progress, isLoading } = useRoute();
  const [locationEnabled] = useState(false);

  const activeRoute = routes[0] ?? null;

  React.useEffect(() => {
    if (activeRoute) selectRoute(activeRoute.id);
  }, [activeRoute, selectRoute]);

  const onRefresh = useCallback(async () => {
    await triggerSync();
  }, [triggerSync]);

  const userName = profile?.full_name ?? 'Collector';
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const routeName = currentRoute?.name ?? 'Route A12';
  const totalWeight = stops.reduce((s, st) => s + (st.expectedWeightKg ?? 0), 0);

  const renderStop = useCallback(
    ({ item }: { item: RouteStopModel }) => (
      <StopItem
        stopNumber={item.stopOrder}
        reelerName={item.reelerId}
        status={item.status as 'pending' | 'done' | 'skipped' | 'visited'}
        expectedQty={item.expectedWeightKg}
        onPress={() => router.push(`/(collector)/ticket/new`)}
        onNavigate={() => {}}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: RouteStopModel) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={stops}
        keyExtractor={keyExtractor}
        renderItem={renderStop}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={BLACK} />
        }
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <View style={styles.topBar}>
              <Text style={styles.logo}>Silk Value</Text>
              <View style={styles.topBarRight}>
                <Text style={styles.userName}>{userName}</Text>
                <SyncDot isSyncing={isSyncing} />
                <Text style={styles.syncLabel}>{isSyncing ? 'SYNCING' : 'SYNCED'}</Text>
              </View>
            </View>

            {/* GPS alert banner */}
            {!locationEnabled && (
              <View style={styles.gpsBanner}>
                <Text style={styles.gpsBannerText}>
                  Location is off. Turn on GPS for accurate stops.
                </Text>
                <TouchableOpacity style={styles.gpsTurnOnBtn}>
                  <Text style={styles.gpsTurnOnText}>TURN ON</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Date + route */}
            <View style={styles.dateBlock}>
              <Text style={styles.dateText}>{dateStr}</Text>
              <Text style={styles.routeSubtitle}>{routeName} · Ramanagara District</Text>
            </View>

            {/* Start Route button */}
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={16} color={WHITE} style={{ marginRight: 8 }} />
              <Text style={styles.startBtnText}>Start Route</Text>
            </TouchableOpacity>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Stops Completed</Text>
                <Text style={styles.statValue}>
                  {progress.completedStops} of {progress.totalStops}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Weight</Text>
                <Text style={styles.statValue}>{totalWeight.toFixed(1)} kg</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.percentComplete}%` },
                ]}
              />
            </View>

            {/* Section label */}
            <Text style={styles.sectionLabel}>TODAY'S STOPS</Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No stops for today</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  listContent: { paddingBottom: 24 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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

  // GPS banner
  gpsBanner: {
    backgroundColor: BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  gpsBannerText: {
    flex: 1,
    fontSize: 13,
    color: WHITE,
    marginRight: 12,
  },
  gpsTurnOnBtn: {
    borderWidth: 1,
    borderColor: WHITE,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gpsTurnOnText: {
    fontSize: 11,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.5,
  },

  // Date block
  dateBlock: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  routeSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  // Start button
  startBtn: {
    backgroundColor: BLACK,
    marginHorizontal: 16,
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  startBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: WHITE,
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Progress bar
  progressBg: {
    height: 6,
    backgroundColor: PROGRESS_BG,
    marginHorizontal: 16,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PROGRESS_FILL,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: TEXT_MUTED,
  },
});
