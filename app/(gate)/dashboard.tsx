import React, { useState, useEffect, useCallback } from 'react';
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
import { getTodayEntries } from '@/services/gate.service';
import GateEntryItem from '@/components/gate/GateEntryItem';
import type { GateEntryRow } from '@/types';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const SURFACE_ALT = '#F5F5F5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const PROGRESS_FILL = '#111111';
const PROGRESS_BG = '#E5E5E5';

export default function GateDashboard() {
  const { profile } = useAuth();
  const { isSyncing, triggerSync } = useSync();
  const [entries, setEntries] = useState<GateEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!profile?.user_id) return;
    setIsLoading(true);
    try {
      const data = await getTodayEntries(profile.user_id);
      setEntries(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const onRefresh = useCallback(async () => {
    await triggerSync();
    await loadEntries();
  }, [triggerSync, loadEntries]);

  // Stats
  const checkedIn = entries.filter((e) => e.qc_status === 'accepted').length;
  const pending = entries.filter((e) => e.qc_status === 'partial_rejection').length;
  const lateEntries = entries.filter((e) => e.qc_status === 'rejected');
  const hasLate = lateEntries.length > 0;

  const totalWeightMT = entries.reduce((s, e) => s + (e.gate_net_weight_kg ?? 0), 0) / 1000;
  const dailyTarget = 10; // metric tons placeholder
  const weightPct = Math.min((totalWeightMT / dailyTarget) * 100, 100);

  const qcPendingCount = entries.filter((e) => e.qc_status === 'partial_rejection').length;

  const operatorName = profile?.full_name
    ? profile.full_name.split(' ')[0].toUpperCase()
    : 'OPERATOR';

  const renderEntry = useCallback(
    ({ item }: { item: GateEntryRow }) => (
      <GateEntryItem
        entry={item}
        onPress={() => router.push(`/(gate)/qc/${item.id}`)}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: GateEntryRow) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderEntry}
        refreshControl={
          <RefreshControl refreshing={isSyncing || isLoading} onRefresh={onRefresh} tintColor={BLACK} />
        }
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity>
                <Ionicons name="menu" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>SILK VALUE</Text>
              <View style={styles.topBarRight}>
                <Text style={styles.operatorLabel}>OPERATOR: {operatorName}</Text>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {operatorName.charAt(0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Late vehicle alert banner */}
            {hasLate && (
              <TouchableOpacity style={styles.alertBanner} activeOpacity={0.85}>
                <View style={styles.alertLeft}>
                  <Text style={styles.alertIcon}>⚠</Text>
                  <View>
                    <Text style={styles.alertTitle}>LATE VEHICLE ALERT</Text>
                    <Text style={styles.alertSub}>
                      {lateEntries.length} vehicle{lateEntries.length > 1 ? 's' : ''} overdue for check-in
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={WHITE} />
              </TouchableOpacity>
            )}

            {/* 2-column stat cards */}
            <View style={styles.statCardsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>CHECKED IN</Text>
                <Text style={styles.statValue}>{checkedIn}</Text>
                <Text style={styles.statUnit}>today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>PENDING ARRIVAL</Text>
                <Text style={styles.statValue}>{pending}</Text>
                <Text style={styles.statUnit}>vehicles</Text>
              </View>
            </View>

            {/* Weight card */}
            <View style={styles.weightCard}>
              <Text style={styles.statLabel}>WEIGHT DISPATCHED</Text>
              <View style={styles.weightValueRow}>
                <Text style={styles.weightValue}>{totalWeightMT.toFixed(2)}</Text>
                <Text style={styles.weightUnit}>METRIC TONS</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${weightPct}%` }]} />
              </View>
              <Text style={styles.weightCaption}>{weightPct.toFixed(0)}% of daily quota</Text>
            </View>

            {/* QC card */}
            <TouchableOpacity
              style={styles.qcCard}
              onPress={() => router.push('/(gate)/checkin')}
              activeOpacity={0.85}
            >
              <View style={styles.qcCardLeft}>
                <Text style={styles.qcLabel}>QUALITY CONTROL</Text>
                <Text style={styles.qcCount}>{qcPendingCount}</Text>
                <Text style={styles.qcSub}>entries pending review</Text>
                <Text style={styles.qcTap}>TAP TO REVIEW →</Text>
              </View>
              <View style={styles.qcIconBox}>
                <Ionicons name="checkmark-done" size={24} color={WHITE} />
              </View>
            </TouchableOpacity>

            {/* Arrivals section */}
            <View style={styles.arrivalsHeader}>
              <Text style={styles.arrivalsTitle}>EXPECTED ARRIVALS TODAY</Text>
              <Text style={styles.arrivalsSubtitle}>LIVE SCHEDULE MANIFEST</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No arrivals scheduled for today</Text>
            </View>
          ) : null
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  operatorLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
  },

  // Alert banner
  alertBanner: {
    backgroundColor: BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertIcon: {
    fontSize: 18,
    color: WHITE,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Stat cards
  statCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  statUnit: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  // Weight card
  weightCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  weightValue: {
    fontSize: 40,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginRight: 8,
  },
  weightUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    marginBottom: 8,
  },
  progressBg: {
    height: 6,
    backgroundColor: PROGRESS_BG,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PROGRESS_FILL,
  },
  weightCaption: {
    fontSize: 12,
    color: TEXT_MUTED,
  },

  // QC card
  qcCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qcCardLeft: { flex: 1 },
  qcLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  qcCount: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  qcSub: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 6,
  },
  qcTap: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  qcIconBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Arrivals header
  arrivalsHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  arrivalsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  arrivalsSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },

  // List content padding
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
});
