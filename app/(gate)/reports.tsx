import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { formatWeight } from '@/utils/format';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const GREEN = '#22C55E';
const RED = '#EF4444';
const AMBER = '#F59E0B';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PeriodStats {
  total: number;
  totalWeight: number;
  accepted: number;
  overrides: number;
  passRate: number;
}

// ---------------------------------------------------------------------------
// Inline StatCard component (no import)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <View style={[styles.statCard, accent ? { borderTopWidth: 3, borderTopColor: accent } : {}]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function isoStartOf(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoEndOf(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [todayStats, setTodayStats] = useState<PeriodStats | null>(null);
  const [weekStats, setWeekStats] = useState<PeriodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const todayStart = isoStartOf(now);
      const todayEnd = isoEndOf(now);
      const weekStart = startOfWeek(now).toISOString();

      // Fetch today's entries
      const { data: todayData, error: todayErr } = await supabase
        .from('gate_entries')
        .select('gate_gross_weight_kg, qc_status, override_status')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      if (todayErr) throw new Error(todayErr.message);

      // Fetch this week's entries
      const { data: weekData, error: weekErr } = await supabase
        .from('gate_entries')
        .select('gate_gross_weight_kg, qc_status, override_status')
        .gte('created_at', weekStart);

      if (weekErr) throw new Error(weekErr.message);

      function computeStats(rows: Array<{
        gate_gross_weight_kg: number;
        qc_status: string;
        override_status: string | null;
      }>): PeriodStats {
        const total = rows.length;
        const totalWeight = rows.reduce((sum, r) => sum + (r.gate_gross_weight_kg ?? 0), 0);
        const accepted = rows.filter((r) =>
          r.qc_status === 'accepted' || r.qc_status === 'override_accepted'
        ).length;
        const overrides = rows.filter((r) => r.override_status != null).length;
        const passRate = total > 0 ? (accepted / total) * 100 : 0;
        return { total, totalWeight, accepted, overrides, passRate };
      }

      setTodayStats(computeStats((todayData ?? []) as Array<{
        gate_gross_weight_kg: number;
        qc_status: string;
        override_status: string | null;
      }>));
      setWeekStats(computeStats((weekData ?? []) as Array<{
        gate_gross_weight_kg: number;
        qc_status: string;
        override_status: string | null;
      }>));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reports.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStats(true);
  }, [fetchStats]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderStatsGrid(stats: PeriodStats) {
    return (
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label="TOTAL VEHICLES"
            value={String(stats.total)}
            sub="check-ins"
            accent={BLACK}
          />
          <StatCard
            label="TOTAL WEIGHT"
            value={formatWeight(stats.totalWeight)}
            accent={BLACK}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="PASS RATE"
            value={`${stats.passRate.toFixed(1)}%`}
            sub={`${stats.accepted} accepted`}
            accent={stats.passRate >= 80 ? GREEN : stats.passRate >= 50 ? AMBER : RED}
          />
          <StatCard
            label="OVERRIDES"
            value={String(stats.overrides)}
            sub="manual overrides"
            accent={stats.overrides > 0 ? AMBER : SURFACE_ALT}
          />
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BLACK} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_MUTED} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchStats()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={BLACK}
            colors={[BLACK]}
          />
        }
      >
        {/* Today's summary */}
        <Text style={styles.sectionLabel}>TODAY'S SUMMARY</Text>
        {todayStats && todayStats.total === 0 ? (
          <View style={styles.emptyPeriod}>
            <Text style={styles.emptyPeriodText}>No entries recorded today.</Text>
          </View>
        ) : todayStats ? (
          renderStatsGrid(todayStats)
        ) : null}

        {/* This week */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>THIS WEEK</Text>
        {weekStats && weekStats.total === 0 ? (
          <View style={styles.emptyPeriod}>
            <Text style={styles.emptyPeriodText}>No entries recorded this week.</Text>
          </View>
        ) : weekStats ? (
          renderStatsGrid(weekStats)
        ) : null}

        {/* Pass rate context note */}
        {weekStats && weekStats.total > 0 && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={TEXT_SECONDARY} style={{ marginRight: 8 }} />
            <Text style={styles.noteText}>
              Pass rate is calculated as accepted + override-accepted entries over total check-ins.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: TEXT_SECONDARY, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BLACK,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    marginBottom: 12,
  },

  statsGrid: { marginBottom: 8 },
  statsRow: { flexDirection: 'row', marginBottom: 10 },

  // Inline StatCard styles
  statCard: {
    flex: 1,
    backgroundColor: SURFACE_ALT,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 4 },
  statSub: { fontSize: 11, color: TEXT_SECONDARY },

  emptyPeriod: {
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyPeriodText: { fontSize: 14, color: TEXT_MUTED },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteText: { flex: 1, fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },
});
