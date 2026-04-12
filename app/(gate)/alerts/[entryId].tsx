import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEntryById, updateQcDecision } from '@/services/gate.service';
import { useAuth } from '@/hooks/useAuth';
import Badge from '@/components/shared/Badge';
import type { GateEntryRow, GateQcStatus } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function VarianceAlertDetailScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { profile } = useAuth();
  const [entry, setEntry] = useState<GateEntryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entryId) return;
    getEntryById(entryId)
      .then(setEntry)
      .catch(() => setEntry(null))
      .finally(() => setIsLoading(false));
  }, [entryId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.center}><ActivityIndicator size="large" color={C.black} /></View>
      </SafeAreaView>
    );
  }
  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.center}><Text style={styles.emptyText}>Alert entry not found</Text></View>
      </SafeAreaView>
    );
  }

  const fieldWeight = entry.expected_gross_weight_kg ?? 0;
  const gateWeight = entry.gate_gross_weight_kg ?? 0;
  const variancePct = entry.variance_percent ?? 0;
  const tolerancePct = entry.variance_tolerance_percent ?? 2.5;
  const varianceColor: string = Math.abs(variancePct) > tolerancePct * 2 ? C.red : C.amber;

  const handleForceAccept = () => {
    Alert.alert(
      'Force Accept',
      'This will override the variance check and accept this entry. An audit entry will be logged.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Accept',
          onPress: async () => {
            try {
              // Mock: set override_status = 'approved'
              Alert.alert('Accepted', 'Entry has been force accepted.', [
                { text: 'OK', onPress: () => router.push('/(gate)/dashboard') },
              ]);
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed.');
            }
          },
        },
      ],
    );
  };

  const handleReject = async () => {
    if (!profile?.user_id) return;
    try {
      await updateQcDecision(entry.id, 'rejected' as unknown as GateQcStatus, profile.user_id, 'Rejected from variance alert');
      Alert.alert('Rejected', 'Entry has been rejected.', [
        { text: 'OK', onPress: () => router.push('/(gate)/dashboard') },
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Alert card */}
        <View style={styles.alertCard}>
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>Vehicle</Text>
            <Text style={styles.alertValue}>{entry.id.slice(0, 10).toUpperCase()}</Text>
          </View>
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>Route</Text>
            <Text style={styles.alertValue}>{entry.route_id ?? '—'}</Text>
          </View>
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>Check-in</Text>
            <Text style={styles.alertValue}>
              {entry.check_in_timestamp ? new Date(entry.check_in_timestamp).toLocaleTimeString('en-IN') : '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.weightCompare}>
            <View style={styles.weightCol}>
              <Text style={styles.weightLabel}>Field Weight</Text>
              <Text style={styles.weightNum}>{fieldWeight.toFixed(1)} kg</Text>
            </View>
            <Ionicons name="swap-horizontal" size={20} color={C.textMuted} />
            <View style={styles.weightCol}>
              <Text style={styles.weightLabel}>Gate Weight</Text>
              <Text style={styles.weightNum}>{gateWeight.toFixed(1)} kg</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Variance highlighted */}
          <View style={styles.varianceBlock}>
            <Text style={[styles.varianceBig, { color: varianceColor }]}>
              {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
            </Text>
            <Badge label="OUTSIDE TOLERANCE" variant={Math.abs(variancePct) > tolerancePct * 2 ? 'error' : 'warning'} />
          </View>
          <Text style={styles.toleranceText}>Cluster tolerance: {tolerancePct}%</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push(`/(gate)/qc/${entry.id}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Review QC</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn} onPress={handleForceAccept} activeOpacity={0.85}>
          <Text style={styles.outlineBtnText}>Force Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.85}>
          <Text style={styles.rejectBtnText}>Reject Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Variance Alert</Text>
    </View>
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
  headerTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: T.md, color: C.textMuted },

  alertCard: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.xl,
    padding: S.base, marginBottom: S.xl,
  },
  alertRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  alertLabel: { fontSize: T.base, color: C.textSecondary },
  alertValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  divider: { height: 1, backgroundColor: C.border, marginVertical: S.md },

  weightCompare: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  weightCol: { alignItems: 'center' },
  weightLabel: { fontSize: T.xs, color: C.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  weightNum: { fontSize: T.xl, fontWeight: T.bold, color: C.textPrimary },

  varianceBlock: { alignItems: 'center', paddingVertical: S.md },
  varianceBig: { fontSize: 40, fontWeight: T.black, marginBottom: S.sm },
  toleranceText: { fontSize: T.base, color: C.textMuted, textAlign: 'center' },

  primaryBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: S.sm,
  },
  primaryBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },

  outlineBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: S.sm,
  },
  outlineBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },

  rejectBtn: {
    borderWidth: 1, borderColor: C.red, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  rejectBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.red },
});
