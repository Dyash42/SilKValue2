import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getEntryById, updateQcDecision, clearToLedger } from '@/services/gate.service';
import WeighmentSummary from '@/components/gate/WeighmentSummary';
import QCDecisionPanel from '@/components/gate/QCDecisionPanel';
import Input from '@/components/shared/Input';
import Badge from '@/components/shared/Badge';
import type { GateEntryRow, GateQcStatus } from '@/types';
import type { QCDecision } from '@/components/gate/QCDecisionPanel';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function QCDecisionScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { profile } = useAuth();
  const [entry, setEntry] = useState<GateEntryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeciding, setIsDeciding] = useState(false);

  // QC parameters
  const [moisture, setMoisture] = useState('');
  const [spoilage, setSpoilage] = useState('');
  const [foreignMaterial, setForeignMaterial] = useState('');

  useEffect(() => {
    if (!entryId) return;
    getEntryById(entryId)
      .then(setEntry)
      .catch(() => setEntry(null))
      .finally(() => setIsLoading(false));
  }, [entryId]);

  const fieldWeight = entry?.expected_gross_weight_kg ?? 0;
  const factoryWeight = entry?.gate_gross_weight_kg ?? 0;
  const netWeight = entry?.gate_net_weight_kg ?? factoryWeight - (entry?.vehicle_tare_weight_kg ?? 0);
  const variancePct = entry?.variance_percent ?? null;
  const varianceKg = factoryWeight - fieldWeight;
  const isOutOfTolerance = entry?.within_tolerance === false;

  // Deduction preview
  const moisturePct = parseFloat(moisture) || 0;
  const spoilagePct = parseFloat(spoilage) || 0;
  const foreignPct = parseFloat(foreignMaterial) || 0;
  const totalDeductionPct = moisturePct * 0.5 + spoilagePct + foreignPct; // placeholder rule
  const deductionKg = (netWeight * totalDeductionPct) / 100;
  const finalAccepted = Math.max(0, netWeight - deductionKg);

  const handleDecision = async (decision: QCDecision, notes: string) => {
    if (!entry || !profile?.user_id) return;
    setIsDeciding(true);
    try {
      await updateQcDecision(entry.id, decision as unknown as GateQcStatus, profile.user_id, notes);

      if (decision === 'accepted') {
        // Fire-and-forget ledger credit — non-blocking so QC flow continues
        // even if the ledger write fails (e.g. route_id = 'unknown' in demo).
        clearToLedger(entry.id, finalAccepted, 0, profile.user_id);
      }

      if (decision === 'rejected') {
        Alert.alert('Entry Rejected', 'QC status set to REJECTED.', [
          { text: 'OK', onPress: () => router.push('/(gate)/overview') },
        ]);
      } else {
        // accepted or partial_rejection → Acceptance Breakdown
        router.push({
          pathname: '/(gate)/qc/breakdown',
          params: {
            entryId: entry.id,
            netWeightKg: netWeight.toString(),
            deductionKg: deductionKg.toString(),
            finalAcceptedKg: finalAccepted.toString(),
            decision,
          },
        });
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to record decision.');
    } finally {
      setIsDeciding(false);
    }
  };

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
        <View style={styles.center}><Text style={styles.emptyText}>Entry not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>QC Decision</Text>
          <Text style={styles.subtitle}>#{entry.id.slice(0, 8).toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Weighment summary */}
        <WeighmentSummary
          fieldWeightKg={fieldWeight}
          factoryWeightKg={factoryWeight}
          variancePct={variancePct}
          varianceKg={varianceKg}
        />

        {/* Tolerance badge */}
        <View style={styles.toleranceBadgeRow}>
          <Badge
            label={isOutOfTolerance ? 'OUTSIDE TOLERANCE' : 'WITHIN TOLERANCE'}
            variant={isOutOfTolerance ? 'error' : 'success'}
          />
        </View>

        {/* QC Parameters */}
        <Text style={styles.sectionLabel}>QC PARAMETERS</Text>
        <Input label="Moisture %" value={moisture} onChangeText={setMoisture} placeholder="0" keyboardType="decimal-pad" />
        <Input label="Spoilage %" value={spoilage} onChangeText={setSpoilage} placeholder="0" keyboardType="decimal-pad" />
        <Input label="Foreign Material %" value={foreignMaterial} onChangeText={setForeignMaterial} placeholder="0" keyboardType="decimal-pad" />

        {/* Deduction preview */}
        {(moisturePct > 0 || spoilagePct > 0 || foreignPct > 0) && (
          <View style={styles.deductionCard}>
            <Text style={styles.deductionLabel}>DEDUCTION PREVIEW</Text>
            <Text style={styles.deductionRow}>Deduction: {deductionKg.toFixed(1)} kg</Text>
            <Text style={styles.deductionFinal}>Final Accepted Weight: {finalAccepted.toFixed(1)} kg</Text>
          </View>
        )}

        {/* QC Decision Panel */}
        <QCDecisionPanel onDecision={handleDecision} isLoading={isDeciding} />

        {/* Override link */}
        {isOutOfTolerance && (
          <TouchableOpacity
            style={styles.overrideLink}
            onPress={() => router.push({
              pathname: '/(gate)/qc/override',
              params: { entryId: entry.id, variancePct: String(variancePct ?? 0), tolerancePct: String(entry.variance_tolerance_percent ?? 2.5) },
            })}
          >
            <Text style={styles.overrideText}>Request Override</Text>
          </TouchableOpacity>
        )}
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
      <Text style={styles.title}>QC Decision</Text>
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
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  subtitle: { fontSize: T.base, color: C.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: T.md, color: C.textMuted },

  toleranceBadgeRow: { marginBottom: S.lg },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginTop: S.md, marginBottom: S.sm,
  },

  deductionCard: {
    backgroundColor: C.surfaceAlt, borderRadius: R.lg, padding: S.md, marginBottom: S.lg,
  },
  deductionLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 1, marginBottom: S.xs },
  deductionRow: { fontSize: T.md, color: C.textPrimary, marginBottom: 2 },
  deductionFinal: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },

  overrideLink: { alignItems: 'center', paddingVertical: S.lg },
  overrideText: { fontSize: T.md, fontWeight: T.semibold, color: C.textSecondary, textDecorationLine: 'underline' },
});
