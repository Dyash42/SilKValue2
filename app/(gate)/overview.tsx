import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { getTodayEntries } from '@/services/gate.service';
import GateEntryItem from '@/components/gate/GateEntryItem';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import type { GateEntryRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, accent,
}: { label: string; value: string | number; icon: string; accent?: string }) {
  return (
    <View style={[styles.statCard, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}]}>
      <Ionicons name={icon as any} size={18} color={accent ?? C.textSecondary} style={{ marginBottom: 6 }} />
      <Text style={[styles.statValue, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function GateOverviewScreen() {
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
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const onRefresh = useCallback(async () => {
    await triggerSync();
    await loadEntries();
  }, [triggerSync, loadEntries]);

  // Derived stats
  const totalToday = entries.length;
  const accepted = entries.filter(e => e.qc_status === 'accepted').length;
  const rejected = entries.filter(e => e.qc_status === 'rejected').length;
  const pending = entries.filter(e => !e.qc_status || e.qc_status === 'pending').length;
  const totalNetKg = entries
    .filter(e => e.qc_status === 'accepted')
    .reduce((sum, e) => sum + (e.gate_net_weight_kg ?? 0), 0);

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  const recent = entries.slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={recent}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GateEntryItem
            entry={item}
            onPress={() => router.push(`/(gate)/history/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isSyncing || isLoading} onRefresh={onRefresh} tintColor={C.black} />
        }
        ListHeaderComponent={
          <View>
            {/* ── Top bar ── */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.logo}>Silk Value</Text>
                <Text style={styles.dateText}>{dateStr}</Text>
              </View>
              <View style={styles.topBarRight}>
                <Text style={styles.operatorName} numberOfLines={1}>
                  {profile?.full_name ?? 'Operator'}
                </Text>
                <View style={[styles.syncDot, { backgroundColor: isSyncing ? C.amber : C.green }]} />
                <Text style={styles.syncLabel}>{isSyncing ? 'SYNCING' : 'SYNCED'}</Text>
              </View>
            </View>

            <SyncStatusBar />

            {/* ── Quick action ── */}
            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={() => router.push('/(gate)/weighment')}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
              <Text style={styles.checkInBtnText}>New Check-In</Text>
            </TouchableOpacity>

            {/* ── Stats grid ── */}
            <View style={styles.statsGrid}>
              <StatCard label="Total Today" value={totalToday} icon="layers-outline" />
              <StatCard label="Accepted" value={accepted} icon="checkmark-circle-outline" accent={C.greenText} />
              <StatCard label="Rejected" value={rejected} icon="close-circle-outline" accent={C.redText} />
              <StatCard label="Pending QC" value={pending} icon="time-outline" accent={C.amberText} />
            </View>

            {/* ── Net weight summary ── */}
            <View style={styles.weightSummary}>
              <Text style={styles.weightSummaryLabel}>TOTAL ACCEPTED WEIGHT TODAY</Text>
              <Text style={styles.weightSummaryValue}>{totalNetKg.toFixed(1)} kg</Text>
            </View>

            {/* ── Recent entries header ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT ENTRIES</Text>
              {entries.length > 5 && (
                <TouchableOpacity onPress={() => router.push('/(gate)/history')}>
                  <Text style={styles.seeAll}>SEE ALL</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🏭"
              title="No check-ins today"
              subtitle="Tap 'New Check-In' to record the first gate entry."
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: S.base, paddingTop: S.md, paddingBottom: S.sm,
  },
  logo: { fontSize: T['3xl'], fontWeight: T.black, color: C.textPrimary },
  dateText: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  operatorName: { fontSize: T.base, color: C.textSecondary, fontWeight: T.medium, maxWidth: 120 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary, letterSpacing: 0.5 },

  checkInBtn: {
    backgroundColor: C.black, marginHorizontal: S.base, borderRadius: R.full,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: S.lg,
  },
  checkInBtnText: { color: C.white, fontSize: T.xl, fontWeight: T.bold },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: S.base, gap: S.sm, marginBottom: S.base,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: C.white, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    padding: S.md,
  },
  statValue: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary, letterSpacing: 0.5 },

  weightSummary: {
    marginHorizontal: S.base, backgroundColor: C.black, borderRadius: R.lg,
    padding: S.base, marginBottom: S.lg,
  },
  weightSummaryLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.borderStrong, letterSpacing: 0.5, marginBottom: 4 },
  weightSummaryValue: { fontSize: T['5xl'], fontWeight: T.extrabold, color: C.white },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, marginBottom: S.sm,
  },
  sectionTitle: { fontSize: T.sm, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 1 },
  seeAll: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.5 },
});
