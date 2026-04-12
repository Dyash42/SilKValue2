import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share as RNShare, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@/hooks/useRoute';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/shared/StatCard';
import TripSheetRow from '@/components/collector/TripSheetRow';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function TripSheetScreen() {
  const { currentRoute, stops, progress } = useRoute();
  const { profile } = useAuth();

  const completedStops = stops.filter(s => s.status === 'visited');
  const totalWeight = completedStops.reduce((sum, s) => sum + (s.expectedWeightKg ?? 0), 0);
  const totalTickets = completedStops.length;
  const totalAmount = totalWeight * 480; // placeholder price
  const allResolved = progress.totalStops > 0 && stops.every(s => s.status === 'visited' || s.status === 'skipped');

  const handleShare = async () => {
    try {
      const lines = stops.map(s => {
        if (s.status === 'skipped') return `${s.reelerId} — SKIPPED`;
        return `${s.reelerId} — ${s.expectedWeightKg ?? 0} kg`;
      });
      await RNShare.share({
        message: `Trip Sheet — ${currentRoute?.name ?? 'Route'}\n${lines.join('\n')}\nTotal: ${totalWeight.toFixed(1)} kg | ${fmt(totalAmount)}`,
      });
    } catch { /* swallow */ }
  };

  const handleMarkComplete = () => {
    Alert.alert('Route Complete', 'Route marked as complete. Your supervisor has been notified.', [
      { text: 'OK', onPress: () => router.push('/(collector)/dashboard') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Trip Sheet</Text>
          <Text style={styles.subtitle}>{currentRoute?.name ?? 'Route'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <SyncStatusBar />

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Stops Completed" value={`${progress.completedStops} / ${progress.totalStops}`} />
          <StatCard label="Total Weight" value={`${totalWeight.toFixed(1)} kg`} />
          <StatCard label="Tickets Generated" value={String(totalTickets)} />
          <StatCard label="Total Amount" value={fmt(totalAmount)} />
        </View>

        {/* Vehicle info */}
        <View style={styles.vehicleBlock}>
          <Text style={styles.vehicleText}>Vehicle: —</Text>
          <Text style={styles.vehicleText}>Collector: {profile?.full_name ?? 'Collector'}</Text>
          <Text style={styles.vehicleText}>Route: {currentRoute?.name ?? '—'}</Text>
        </View>

        {/* Collections list */}
        <Text style={styles.sectionLabel}>COLLECTIONS</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, { flex: 1 }]}>Reeler</Text>
          <Text style={[styles.thText, { width: 60, textAlign: 'right' }]}>Weight</Text>
          <Text style={[styles.thText, { width: 48, textAlign: 'center' }]}>Grade</Text>
          <Text style={[styles.thText, { width: 72, textAlign: 'right' }]}>Amount</Text>
        </View>
        {stops.map((s) => (
          <TripSheetRow
            key={s.id}
            reelerName={s.reelerId}
            weightKg={s.status === 'skipped' ? null : s.expectedWeightKg}
            grade={s.status === 'skipped' ? null : 'A'}
            amount={s.status === 'skipped' ? null : (s.expectedWeightKg ?? 0) * 480}
            isSkipped={s.status === 'skipped'}
          />
        ))}

        {/* Expected gate weight */}
        <View style={styles.gateWeight}>
          <Text style={styles.gateWeightLabel}>Expected Gate Weight: {totalWeight.toFixed(1)} kg</Text>
          <Text style={styles.gateWeightNote}>This is the total the gate operator will cross-check against.</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.outlineBtn} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-outline" size={18} color={C.textPrimary} />
          <Text style={styles.outlineBtnText}>Share Trip Sheet</Text>
        </TouchableOpacity>

        {allResolved && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleMarkComplete} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Mark Route Complete</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.lg },

  vehicleBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.md, marginBottom: S.lg,
  },
  vehicleText: { fontSize: T.base, color: C.textSecondary, marginBottom: 2 },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.sm,
  },
  tableHeader: { flexDirection: 'row', paddingVertical: S.sm, borderBottomWidth: 2, borderBottomColor: C.textPrimary },
  thText: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.5 },

  gateWeight: {
    backgroundColor: C.surfaceAlt, borderRadius: R.lg,
    padding: S.md, marginTop: S.lg, marginBottom: S.lg,
  },
  gateWeightLabel: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary, marginBottom: 4 },
  gateWeightNote: { fontSize: T.base, color: C.textSecondary },

  outlineBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, marginBottom: S.sm,
  },
  outlineBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },
  primaryBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
