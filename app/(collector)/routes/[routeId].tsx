import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@/hooks/useRoute';
import { useAuth } from '@/hooks/useAuth';
import StopItem from '@/components/collector/StopItem';
import Badge from '@/components/shared/Badge';
import RouteStopModel from '@/models/RouteStopModel';
import { DT } from '@/constants/designTokens';
import { formatDate } from '@/utils/format';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function statusBadgeVariant(s: string) {
  if (s === 'in_progress') return 'black' as const;
  if (s === 'completed') return 'success' as const;
  return 'grey' as const;
}
function statusLabel(s: string) {
  if (s === 'in_progress') return 'IN PROGRESS';
  if (s === 'completed') return 'COMPLETED';
  return (s ?? 'PLANNED').toUpperCase();
}

export default function RouteDetail() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const { currentRoute, stops, selectRoute, progress } = useRoute();
  const { profile } = useAuth();

  useEffect(() => { if (routeId) selectRoute(routeId); }, [routeId, selectRoute]);

  const totalWeight = stops.reduce((s, st) => s + (st.expectedWeightKg ?? 0), 0);
  const allResolved = progress.totalStops > 0 && stops.every(s => s.status === 'visited' || s.status === 'skipped');
  const nextPending = stops.find(s => s.status === 'pending');

  const renderStop = useCallback(
    ({ item }: { item: RouteStopModel }) => (
      <StopItem
        stopNumber={item.stopOrder}
        reelerName={item.reelerId}
        status={item.status as 'pending' | 'done' | 'skipped' | 'visited'}
        expectedQty={item.expectedWeightKg}
        onPress={() => router.push({ pathname: '/(collector)/arrived-at-stop', params: { stopId: item.id, routeId: routeId ?? '' } })}
        onNavigate={() => router.push({ pathname: '/(collector)/navigate-to-stop', params: { stopId: item.id, routeId: routeId ?? '' } })}
      />
    ),
    [routeId],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{currentRoute?.name ?? 'Route'}</Text>
          {currentRoute && <Text style={styles.subtitle}>{formatDate(currentRoute.date)}</Text>}
        </View>
      </View>

      {/* Route summary */}
      <View style={styles.summaryBlock}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>{progress.completedStops} / {progress.totalStops} completed</Text>
          <Text style={styles.summaryText}>{totalWeight.toFixed(1)} kg collected</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress.percentComplete}%` }]} />
        </View>
        <Badge label={statusLabel(currentRoute?.status ?? 'planned')} variant={statusBadgeVariant(currentRoute?.status ?? 'planned')} />
      </View>

      {/* Vehicle + collector */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>🚗 No vehicle</Text>
        <Text style={styles.infoText}>👤 {profile?.full_name ?? 'Collector'}</Text>
      </View>

      <Text style={styles.sectionLabel}>STOPS</Text>

      <FlatList
        data={stops}
        keyExtractor={(item) => item.id}
        renderItem={renderStop}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stops on this route</Text>
          </View>
        }
      />

      {/* Footer action */}
      <View style={styles.footer}>
        {allResolved ? (
          <TouchableOpacity style={styles.footerBtn} onPress={() => router.push('/(collector)/trip-sheet')} activeOpacity={0.85}>
            <Text style={styles.footerBtnText}>View Trip Sheet</Text>
          </TouchableOpacity>
        ) : nextPending ? (
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => router.push({ pathname: '/(collector)/navigate-to-stop', params: { stopId: nextPending.id, routeId: routeId ?? '' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.footerBtnText}>Continue to Next Stop</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { marginRight: S.sm },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  subtitle: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },

  summaryBlock: { paddingHorizontal: S.base, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S.sm },
  summaryText: { fontSize: T.base, color: C.textSecondary },
  progressBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: S.md },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: C.textPrimary },

  infoRow: {
    flexDirection: 'row', gap: S.lg, paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoText: { fontSize: T.base, color: C.textSecondary },

  sectionLabel: {
    fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: S.base, paddingTop: S.base, paddingBottom: S.sm,
  },
  listContent: { paddingHorizontal: S.base, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: T.md, color: C.textMuted },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: S.base, paddingBottom: S.xl, backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  footerBtn: {
    backgroundColor: C.black, borderRadius: R.full,
    paddingVertical: 14, alignItems: 'center',
  },
  footerBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
