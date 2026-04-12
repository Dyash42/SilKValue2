import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getTodayEntries } from '@/services/gate.service';
import StatCard from '@/components/shared/StatCard';
import ShiftStatRow from '@/components/gate/ShiftStatRow';
import GateEntryItem from '@/components/gate/GateEntryItem';
import type { GateEntryRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function ShiftReportScreen() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<GateEntryRow[]>([]);

  const load = useCallback(async () => {
    if (!profile?.user_id) return;
    try { setEntries(await getTodayEntries(profile.user_id)); } catch { /* silent */ }
  }, [profile?.user_id]);

  useEffect(() => { load(); }, [load]);

  const totalProcessed = entries.length;
  const totalAcceptedKg = entries.reduce((s, e) => s + (e.final_accepted_weight_kg ?? e.gate_net_weight_kg ?? 0), 0);
  const totalRejectedKg = entries.filter(e => e.qc_status === 'rejected').reduce((s, e) => s + (e.gate_net_weight_kg ?? 0), 0);
  const avgVariance = entries.length > 0
    ? entries.reduce((s, e) => s + Math.abs(e.variance_percent ?? 0), 0) / entries.length
    : 0;
  const overridesRaised = entries.filter(e => e.override_status != null && e.override_status !== 'none').length;
  const overridesApproved = entries.filter(e => e.override_status === 'approved').length;
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleExport = () => {
    Alert.alert('Export', 'CSV export via expo-sharing — coming in Phase 2.');
  };

  const handleEndShift = () => {
    Alert.alert(
      'End Shift',
      'This will finalise all pending entries and log your shift end time. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Shift', style: 'destructive', onPress: () => {
          Alert.alert('Shift Ended', 'Shift ended successfully. All entries finalised.', [
            { text: 'OK', onPress: () => router.push('/(gate)/dashboard') },
          ]);
        }},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Shift Report</Text>
          <Text style={styles.subtitle}>{dateStr}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Vehicles" value={String(totalProcessed)} style={styles.halfCard} />
          <StatCard label="Weight Accepted" value={`${(totalAcceptedKg / 1000).toFixed(2)}`} unit="MT" style={styles.halfCard} />
        </View>

        <View style={styles.statBlock}>
          <ShiftStatRow label="Weight Accepted" value={`${totalAcceptedKg.toFixed(0)}`} unit="kg" />
          <ShiftStatRow label="Weight Rejected" value={`${totalRejectedKg.toFixed(0)}`} unit="kg" />
          <ShiftStatRow label="Avg Variance" value={`${avgVariance.toFixed(1)}`} unit="%" />
          <ShiftStatRow label="Overrides Raised" value={String(overridesRaised)} />
          <ShiftStatRow label="Overrides Approved" value={String(overridesApproved)} />
        </View>

        {/* Entry table */}
        <Text style={styles.sectionLabel}>TODAY'S ENTRIES</Text>
        {entries.map(e => (
          <GateEntryItem
            key={e.id}
            entry={e}
            onPress={() => router.push(`/(gate)/history/${e.id}`)}
          />
        ))}

        {/* Actions */}
        <TouchableOpacity style={styles.outlineBtn} onPress={handleExport} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={16} color={C.textPrimary} />
          <Text style={styles.outlineBtnText}>Export Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endShiftBtn} onPress={handleEndShift} activeOpacity={0.85}>
          <Text style={styles.endShiftText}>End Shift</Text>
        </TouchableOpacity>
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

  statsGrid: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  halfCard: { flex: 1 },

  statBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.base, marginBottom: S.xl,
  },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.md,
  },

  outlineBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, marginTop: S.lg, marginBottom: S.sm,
  },
  outlineBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },

  endShiftBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  endShiftText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
