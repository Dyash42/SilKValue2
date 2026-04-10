import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getEntryById, updateQcDecision } from '@/services/gate.service';
import WeighmentSummary from '@/components/gate/WeighmentSummary';
import QCDecisionPanel from '@/components/gate/QCDecisionPanel';
import type { GateEntryRow, GateQcStatus } from '@/types';
import type { QCDecision } from '@/components/gate/QCDecisionPanel';

// Design system colors
const BG = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function QCReview() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { profile } = useAuth();
  const [entry, setEntry] = useState<GateEntryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeciding, setIsDeciding] = useState(false);

  useEffect(() => {
    if (!entryId) return;
    getEntryById(entryId)
      .then(setEntry)
      .catch(() => setEntry(null))
      .finally(() => setIsLoading(false));
  }, [entryId]);

  const handleDecision = async (decision: QCDecision, notes: string) => {
    if (!entry || !profile?.user_id) return;
    setIsDeciding(true);
    try {
      await updateQcDecision(entry.id, decision as unknown as GateQcStatus, profile.user_id, notes);
      Alert.alert('Decision Recorded', `QC status set to ${decision.toUpperCase()}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to record decision');
    } finally {
      setIsDeciding(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.title}>QC Review</Text>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.title}>QC Review</Text>
        </View>
        <View style={styles.loadingState}>
          <Text style={styles.emptyText}>Entry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fieldWeight = entry.expected_gross_weight_kg ?? 0;
  const factoryWeight = entry.gate_gross_weight_kg ?? 0;
  const variancePct = entry.variance_percent ?? null;
  const varianceKg = factoryWeight - fieldWeight;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>QC Review</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Ticket Information */}
        <Text style={styles.sectionLabel}>TICKET INFORMATION</Text>
        <View style={styles.infoBlock}>
          <InfoRow label="ENTRY ID" value={entry.id.slice(0, 12).toUpperCase()} />
          <InfoRow
            label="CHECK-IN TIME"
            value={entry.check_in_timestamp
              ? new Date(entry.check_in_timestamp).toLocaleString('en-IN')
              : '—'}
          />
          <InfoRow label="OPERATOR" value={entry.gate_operator_id?.slice(0, 8).toUpperCase() ?? '—'} />
          <InfoRow label="SCALE ID" value={entry.scale_id ?? '—'} />
        </View>

        {/* Weight Details */}
        <Text style={styles.sectionLabel}>WEIGHT DETAILS</Text>
        <WeighmentSummary
          fieldWeightKg={fieldWeight}
          factoryWeightKg={factoryWeight}
          variancePct={variancePct}
          varianceKg={varianceKg}
        />

        {/* QC Decision */}
        <Text style={styles.sectionLabel}>QC DECISION</Text>
        <QCDecisionPanel onDecision={handleDecision} isLoading={isDeciding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },
  infoBlock: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
});
