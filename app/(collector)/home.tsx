import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useRoute } from '@/hooks/useRoute';
import StopItem from '@/components/collector/StopItem';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import RouteStopModel from '@/models/RouteStopModel';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function SyncDot({ isSyncing }: { isSyncing: boolean }) {
  return <View style={[styles.syncDot, { backgroundColor: isSyncing ? C.amber : C.green }]} />;
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

  const onRefresh = useCallback(async () => { await triggerSync(); }, [triggerSync]);

  const userName = profile?.full_name ?? 'Collector';
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const routeName = currentRoute?.name ?? 'No route';
  const totalWeight = stops.reduce((s, st) => s + (st.expectedWeightKg ?? 0), 0);
  const allDone = progress.totalStops > 0 && progress.completedStops >= progress.totalStops;
  const routeStatus = currentRoute?.status ?? 'planned';

  const startBtnLabel = allDone ? 'End Route' : routeStatus === 'in_progress' ? 'Continue Route' : 'Start Route';

  const handleStartRoute = () => {
    if (allDone) {
      router.push('/(collector)/trip-sheet');
      return;
    }
    const nextStop = stops.find((s) => s.status === 'pending');
    if (nextStop) {
      router.push({ pathname: '/(collector)/navigate-to-stop', params: { stopId: nextStop.id, routeId: currentRoute?.id ?? '' } });
    }
  };

  const renderStop = useCallback(
    ({ item }: { item: RouteStopModel }) => (
      <StopItem
        stopNumber={item.stopOrder}
        reelerName={item.reelerId}
        status={item.status as 'pending' | 'done' | 'skipped' | 'visited'}
        expectedQty={item.expectedWeightKg}
        onPress={() => router.push({ pathname: '/(collector)/arrived-at-stop', params: { stopId: item.id, routeId: currentRoute?.id ?? '' } })}
        onNavigate={() => router.push({ pathname: '/(collector)/navigate-to-stop', params: { stopId: item.id, routeId: currentRoute?.id ?? '' } })}
      />
    ),
    [currentRoute],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={stops}
        keyExtractor={(item) => item.id}
        renderItem={renderStop}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={C.black} />}
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <View style={styles.topBar}>
              <Text style={styles.logo}>Silk Value</Text>
              <View style={styles.topBarRight}>
                <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                <SyncDot isSyncing={isSyncing} />
                <Text style={styles.syncLabel}>{isSyncing ? 'SYNCING' : 'SYNCED'}</Text>
              </View>
            </View>

            <SyncStatusBar />

            {/* GPS banner */}
            {!locationEnabled && (
              <View style={styles.gpsBanner}>
                <Text style={styles.gpsBannerText}>Location is off. Turn on GPS for accurate stops.</Text>
                <TouchableOpacity style={styles.gpsTurnOnBtn} onPress={() => Linking.openSettings()}>
                  <Text style={styles.gpsTurnOnText}>TURN ON</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Date + route */}
            <View style={styles.dateBlock}>
              <Text style={styles.dateText}>{dateStr}</Text>
              <Text style={styles.routeSubtitle}>{routeName}</Text>
            </View>

            {/* Start Route button */}
            {activeRoute && (
              <TouchableOpacity style={styles.startBtn} onPress={handleStartRoute} activeOpacity={0.85}>
                <Ionicons name={allDone ? 'checkmark-circle' : 'play'} size={16} color={C.white} style={{ marginRight: 8 }} />
                <Text style={styles.startBtnText}>{startBtnLabel}</Text>
              </TouchableOpacity>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STOPS COMPLETED</Text>
                <Text style={styles.statValue}>{progress.completedStops} of {progress.totalStops}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TOTAL WEIGHT</Text>
                <Text style={styles.statValue}>{totalWeight.toFixed(1)} kg</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressPercent}>{progress.percentComplete}% complete</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progress.percentComplete}%` }]} />
              </View>
            </View>

            {/* Links */}
            {activeRoute && (
              <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => router.push(`/(collector)/routes/${activeRoute.id}`)}>
                  <Text style={styles.linkText}>VIEW FULL ROUTE</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(collector)/trip-sheet')}>
                  <Text style={styles.linkText}>TRIP SHEET</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionLabel}>TODAY'S STOPS</Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="🗺️"
              title="No route for today"
              subtitle="Your supervisor will assign a route. Pull down to refresh."
            />
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: S['3xl'] },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
  },
  logo: { fontSize: T['3xl'], fontWeight: T.black, color: C.textPrimary },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: T.base, color: C.textSecondary, fontWeight: T.medium, maxWidth: 100 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary, letterSpacing: 0.5 },

  gpsBanner: {
    backgroundColor: C.black, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: S.base, paddingVertical: 10,
    marginHorizontal: S.base, marginBottom: S.base, borderRadius: R.md,
  },
  gpsBannerText: { flex: 1, fontSize: T.base, color: C.white, marginRight: S.md },
  gpsTurnOnBtn: { borderWidth: 1, borderColor: C.white, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 4 },
  gpsTurnOnText: { fontSize: T.sm, fontWeight: T.bold, color: C.white, letterSpacing: 0.5 },

  dateBlock: { paddingHorizontal: S.base, marginBottom: S.base },
  dateText: { fontSize: T['5xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  routeSubtitle: { fontSize: T.md, color: C.textSecondary },

  startBtn: {
    backgroundColor: C.black, marginHorizontal: S.base, borderRadius: R.full,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: S.lg,
  },
  startBtnText: { color: C.white, fontSize: T.xl, fontWeight: T.bold },

  statsRow: {
    flexDirection: 'row', marginHorizontal: S.base,
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.base, marginBottom: S.md,
  },
  statItem: { flex: 1 },
  statDivider: { width: 1, backgroundColor: C.border, marginHorizontal: S.base },
  statLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: T['5xl'], fontWeight: T.bold, color: C.textPrimary },

  progressContainer: { paddingHorizontal: S.base, marginBottom: S.base },
  progressPercent: { fontSize: T.base, color: C.textSecondary, marginBottom: 4 },
  progressBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: C.textPrimary },

  linksRow: { flexDirection: 'row', justifyContent: 'center', gap: S.xl, marginBottom: S.lg },
  linkText: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.5 },

  sectionLabel: {
    fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: S.base, marginBottom: S.md,
  },
});
