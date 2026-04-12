import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import { useSync } from '@/hooks/useSync';
import { useLedger } from '@/hooks/useLedger';
import { useAuthStore } from '@/stores/auth.store';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import { formatCurrency } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GRADES = ['A+', 'A', 'B', 'C', 'Reject'] as const;
type Grade = typeof GRADES[number];

function gradeColor(g: Grade) {
  if (g === 'A+' || g === 'A') return C.greenText;
  if (g === 'B') return C.amberText;
  return C.redText;
}

function MetricCard({ label, value, sub, dark }: { label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <View style={[styles.metricCard, dark ? { backgroundColor: C.black } : { backgroundColor: C.surfaceAlt }]}>
      <Text style={[styles.metricLabel, dark && { color: C.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, dark && { color: C.white }]}>{value}</Text>
      {sub ? <Text style={[styles.metricSub, dark && { color: C.textMuted }]}>{sub}</Text> : null}
    </View>
  );
}

export default function EarningsScreen() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const { pendingTickets } = useCollectionTicket();
  const { isSyncing, pendingCount, error: syncError, triggerSync } = useSync();
  const { profile } = useAuthStore();
  const {
    summary: ledgerSummary,
    isLoading: ledgerLoading,
    error: ledgerError,
    refresh: refreshLedger,
  } = useLedger(profile?.id ?? null);

  const monthTickets = useMemo(
    () => pendingTickets.filter((t) => {
      const d = t.collectionTimestamp;
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }),
    [pendingTickets, selectedMonth, selectedYear],
  );

  const totalEarnings = useMemo(() => monthTickets.reduce((s, t) => s + t.totalAmount, 0), [monthTickets]);
  const totalWeight = useMemo(() => monthTickets.reduce((s, t) => s + t.netWeightKg, 0), [monthTickets]);

  const gradeBreakdown = useMemo(() => {
    const map: Record<string, { count: number; weight: number; amount: number }> = {};
    for (const g of GRADES) map[g] = { count: 0, weight: 0, amount: 0 };
    for (const t of monthTickets) {
      const g = t.qualityGrade || 'Reject';
      if (map[g]) { map[g].count += 1; map[g].weight += t.netWeightKg; map[g].amount += t.totalAmount; }
    }
    return map;
  }, [monthTickets]);

  const maxGradeWeight = useMemo(
    () => Math.max(...Object.values(gradeBreakdown).map((v) => v.weight), 1),
    [gradeBreakdown],
  );

  const prevMonth = useCallback(() => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  }, [selectedMonth]);

  const nextMonth = useCallback(() => {
    if (selectedYear > now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth())) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  }, [selectedMonth, selectedYear, now]);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const handleRefresh = useCallback(async () => {
    await triggerSync();
    refreshLedger();
  }, [triggerSync, refreshLedger]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <SyncStatusBar isSyncing={isSyncing} pendingCount={pendingCount} error={syncError} onSync={triggerSync} onRetry={triggerSync} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} tintColor={C.black} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Live Ledger Balance ── */}
        <View style={styles.ledgerCard}>
          <View style={styles.ledgerCardRow}>
            <View>
              <Text style={styles.ledgerLabel}>CONFIRMED BALANCE</Text>
              {ledgerLoading ? (
                <ActivityIndicator size="small" color={C.white} style={{ marginTop: 4 }} />
              ) : (
                <Text style={styles.ledgerBalance}>
                  {formatCurrency(ledgerSummary?.balance ?? 0)}
                </Text>
              )}
              <Text style={styles.ledgerSub}>
                Credited: {formatCurrency(ledgerSummary?.totalCredited ?? 0)}
              </Text>
            </View>
            <View style={styles.ledgerRight}>
              <View style={styles.ledgerStatBox}>
                <Text style={styles.ledgerStatLabel}>ENTRIES</Text>
                <Text style={styles.ledgerStatVal}>{ledgerSummary?.entryCount ?? 0}</Text>
              </View>
              <View style={styles.ledgerStatBox}>
                <Text style={styles.ledgerStatLabel}>DEBITED</Text>
                <Text style={styles.ledgerStatVal}>
                  {formatCurrency(ledgerSummary?.totalDebited ?? 0)}
                </Text>
              </View>
            </View>
          </View>
          {ledgerError ? (
            <TouchableOpacity onPress={refreshLedger} style={styles.ledgerErrorRow}>
              <Ionicons name="alert-circle-outline" size={13} color={C.amberText} />
              <Text style={styles.ledgerErrorText}>Could not sync balance — tap to retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {/* Month selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[selectedMonth]} {selectedYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={[styles.monthBtn, isCurrentMonth && styles.monthBtnDisabled]} disabled={isCurrentMonth}>
            <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? C.textMuted : C.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Metric cards */}
        <View style={styles.metricsGrid}>
          <MetricCard label="TOTAL EARNINGS" value={formatCurrency(totalEarnings)} dark />
          <MetricCard label="COLLECTIONS" value={String(monthTickets.length)} sub="this month" />
          <MetricCard label="TOTAL WEIGHT" value={`${totalWeight.toFixed(1)} kg`} />
        </View>

        {/* Grade breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GRADE BREAKDOWN</Text>
          {GRADES.map((g) => {
            const data = gradeBreakdown[g];
            if (data.count === 0) return null;
            const barW = maxGradeWeight > 0 ? (data.weight / maxGradeWeight) * 100 : 0;
            return (
              <View key={g} style={styles.gradeRow}>
                <View style={[styles.gradeDot, { backgroundColor: gradeColor(g) }]} />
                <Text style={styles.gradeKey}>{g}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${barW}%` as any, backgroundColor: gradeColor(g) }]} />
                </View>
                <Text style={styles.gradeWeight}>{data.weight.toFixed(1)} kg</Text>
                <Text style={styles.gradeAmount}>{formatCurrency(data.amount)}</Text>
              </View>
            );
          })}
          {monthTickets.length === 0 && (
            <Text style={styles.emptyText}>No collections in this period.</Text>
          )}
        </View>

        {/* ESG Report link */}
        <TouchableOpacity style={styles.esgLink} onPress={() => router.push('/(reeler)/esg-report')} activeOpacity={0.8}>
          <Ionicons name="leaf-outline" size={18} color={C.greenText} />
          <Text style={styles.esgLinkText}>View ESG Report</Text>
          <Ionicons name="chevron-forward" size={16} color={C.greenText} />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(reeler)/report-table')} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={16} color={C.textPrimary} />
            <Text style={styles.actionBtnText}>Detailed Table</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => alert('PDF export coming soon.')} activeOpacity={0.85}>
            <Ionicons name="document-outline" size={16} color={C.white} />
            <Text style={[styles.actionBtnText, { color: C.white }]}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 40 },

  // ── Live ledger balance card ───────────────────────────────────────────────
  ledgerCard: {
    margin: S.base, backgroundColor: C.black, borderRadius: R.xl, padding: S.lg,
  },
  ledgerCardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  ledgerLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textMuted, letterSpacing: 1, marginBottom: S.xs },
  ledgerBalance: { fontSize: T['4xl'], fontWeight: T.extrabold, color: C.white, marginBottom: 4 },
  ledgerSub: { fontSize: T.base, color: C.textMuted },
  ledgerRight: { gap: S.sm, alignItems: 'flex-end' },
  ledgerStatBox: { alignItems: 'flex-end' },
  ledgerStatLabel: { fontSize: T.xs, color: C.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  ledgerStatVal: { fontSize: T.lg, fontWeight: T.bold, color: C.white },
  ledgerErrorRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    marginTop: S.sm, backgroundColor: C.amberBg, borderRadius: R.sm,
    paddingHorizontal: S.sm, paddingVertical: 6,
  },
  ledgerErrorText: { fontSize: T.xs, color: C.amberText, flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: S.base, gap: S.xl },
  monthBtn: { padding: S.xs },
  monthBtnDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: T.xl, fontWeight: T.bold, color: C.textPrimary, minWidth: 120, textAlign: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, paddingHorizontal: S.base, paddingBottom: S.base },
  metricCard: { flex: 1, minWidth: 100, borderRadius: R.lg, padding: S.md },
  metricLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.8, marginBottom: 4 },
  metricValue: { fontSize: T['3xl'], fontWeight: T.extrabold, color: C.textPrimary },
  metricSub: { fontSize: T.xs, color: C.textMuted, marginTop: 2 },
  section: { paddingHorizontal: S.base, marginBottom: S.base },
  sectionTitle: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.md },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  gradeDot: { width: 8, height: 8, borderRadius: R.full },
  gradeKey: { width: 36, fontSize: T.base, fontWeight: T.bold, color: C.textPrimary },
  barTrack: { flex: 1, height: 8, backgroundColor: C.surfaceAlt, borderRadius: R.full, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: R.full },
  gradeWeight: { width: 60, fontSize: T.base, color: C.textSecondary, textAlign: 'right' },
  gradeAmount: { width: 72, fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary, textAlign: 'right' },
  emptyText: { fontSize: T.base, color: C.textMuted, textAlign: 'center', paddingVertical: S.xl },
  esgLink: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    marginHorizontal: S.base, marginBottom: S.base,
    padding: S.md, borderRadius: R.lg, borderWidth: 1,
    borderColor: C.greenText, backgroundColor: C.greenBg,
  },
  esgLinkText: { flex: 1, fontSize: T.md, fontWeight: T.semibold, color: C.greenText },
  actionsRow: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.base },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.xs, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingVertical: 12,
  },
  actionBtnPrimary: { backgroundColor: C.black, borderColor: C.black },
  actionBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
});
