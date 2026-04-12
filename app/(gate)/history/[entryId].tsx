import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share as RNShare, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEntryById } from '@/services/gate.service';
import WeighmentSummary from '@/components/gate/WeighmentSummary';
import Badge from '@/components/shared/Badge';
import PerReelerRow from '@/components/gate/PerReelerRow';
import type { GateEntryRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const MOCK_REELERS = [
  { name: 'Rajesh Kumar', fieldKg: 28.5, acceptedKg: 27.8, deductionKg: 0.7, amount: 13344, isSkipped: false },
  { name: 'Sita Devi', fieldKg: 22.0, acceptedKg: 21.5, deductionKg: 0.5, amount: 10320, isSkipped: false },
  { name: 'Venkat Rao', fieldKg: 0, acceptedKg: 0, deductionKg: 0, amount: 0, isSkipped: true },
];

export default function EntryDetailScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<GateEntryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

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
        <Header date="" />
        <View style={styles.center}><ActivityIndicator size="large" color={C.black} /></View>
      </SafeAreaView>
    );
  }
  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header date="" />
        <View style={styles.center}><Text style={styles.emptyText}>Entry not found</Text></View>
      </SafeAreaView>
    );
  }

  const fieldWeight = entry.expected_gross_weight_kg ?? 0;
  const factoryWeight = entry.gate_gross_weight_kg ?? 0;
  const netWeight = entry.gate_net_weight_kg ?? 0;
  const variancePct = entry.variance_percent ?? null;
  const varianceKg = factoryWeight - fieldWeight;
  const dateStr = entry.check_in_timestamp ? new Date(entry.check_in_timestamp).toLocaleDateString('en-IN') : '';

  const statusBadge = () => {
    switch (entry.qc_status) {
      case 'accepted': return { label: 'PASSED', variant: 'success' as const };
      case 'rejected': return { label: 'REJECTED', variant: 'error' as const };
      case 'partial_rejection': return { label: 'PARTIAL', variant: 'warning' as const };
      default: return { label: 'PENDING', variant: 'grey' as const };
    }
  };
  const { label, variant } = statusBadge();
  const hasOverride = entry.override_status != null && entry.override_status !== 'none';

  const handleExport = async () => {
    try {
      await RNShare.share({
        message: `Gate Entry — #${entry.id.slice(0, 8)}\nVehicle: ${entry.id}\nField: ${fieldWeight} kg · Gate: ${factoryWeight} kg\nNet: ${netWeight} kg · Status: ${label}`,
      });
    } catch { /* swallow */ }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header date={dateStr} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Entry summary card */}
        <View style={styles.card}>
          <Row label="Vehicle" value={entry.id.slice(0, 10).toUpperCase()} />
          <Row label="Route" value={entry.route_id ?? '—'} />
          <Row label="Collector" value={entry.collector_id?.slice(0, 10) ?? '—'} />
          <Row label="Check-in Time" value={entry.check_in_timestamp ? new Date(entry.check_in_timestamp).toLocaleString('en-IN') : '—'} />
          <Row label="Scale ID" value={entry.scale_id ?? '—'} />
          <Row label="Calibration" value={entry.scale_calibration_date ?? '—'} noBorder />
        </View>

        {/* Weight block */}
        <WeighmentSummary
          fieldWeightKg={fieldWeight}
          factoryWeightKg={factoryWeight}
          variancePct={variancePct}
          varianceKg={varianceKg}
        />
        <View style={styles.toleranceBadgeRow}>
          <Badge
            label={entry.within_tolerance === false ? 'OUTSIDE TOLERANCE' : 'WITHIN TOLERANCE'}
            variant={entry.within_tolerance === false ? 'error' : 'success'}
          />
        </View>

        {/* QC block */}
        <Text style={styles.sectionLabel}>QC DETAILS</Text>
        <View style={styles.card}>
          <Row label="Moisture" value={`${entry.moisture_percent ?? 0}%`} />
          <Row label="Spoilage" value={`${entry.spoilage_percent ?? 0}%`} />
          <Row label="Foreign Material" value={`${entry.foreign_material_percent ?? 0}%`} />
          <Row label="Deduction" value={`${entry.deduction_kg ?? 0} kg`} />
          <Row label="Final Accepted" value={`${entry.final_accepted_weight_kg ?? netWeight} kg`} />
          <View style={styles.statusRow}>
            <Text style={styles.rowLabel}>QC Status</Text>
            <Badge label={label} variant={variant} />
          </View>
        </View>

        {/* Override block */}
        {hasOverride && (
          <>
            <Text style={styles.sectionLabel}>OVERRIDE</Text>
            <View style={styles.card}>
              <Row label="Override Status" value={entry.override_status ?? '—'} />
              <Row label="Override Reason" value={entry.override_notes ?? '—'} noBorder />
            </View>
          </>
        )}

        {/* Per-reeler breakdown (collapsible) */}
        <TouchableOpacity style={styles.collapseBtn} onPress={() => setShowBreakdown(!showBreakdown)} activeOpacity={0.8}>
          <Text style={styles.collapseBtnText}>Per-Reeler Breakdown</Text>
          <Ionicons name={showBreakdown ? 'chevron-up' : 'chevron-down'} size={16} color={C.textSecondary} />
        </TouchableOpacity>
        {showBreakdown && MOCK_REELERS.map((r, i) => (
          <PerReelerRow
            key={i}
            reelerName={r.name}
            fieldQtyKg={r.fieldKg}
            acceptedQtyKg={r.acceptedKg}
            deductionKg={r.deductionKg}
            amount={r.amount}
            isSkipped={r.isSkipped}
          />
        ))}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.outlineBtn} onPress={handleExport} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={16} color={C.textPrimary} />
            <Text style={styles.outlineBtnText}>Export Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => Alert.alert('Coming soon', 'PDF export available in Phase 2.')}
            activeOpacity={0.85}
          >
            <Ionicons name="document-outline" size={16} color={C.textPrimary} />
            <Text style={styles.outlineBtnText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ date }: { date: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>Entry Detail</Text>
        {date ? <Text style={styles.headerDate}>{date}</Text> : null}
      </View>
    </View>
  );
}

function Row({ label, value, noBorder }: { label: string; value: string; noBorder?: boolean }) {
  return (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  headerDate: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: T.md, color: C.textMuted },

  card: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.md,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowLabel: { fontSize: T.base, color: C.textSecondary },
  rowValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, maxWidth: '60%', textAlign: 'right' },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 12,
  },
  toleranceBadgeRow: { marginBottom: S.lg },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginTop: S.md, marginBottom: S.sm,
  },

  collapseBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: S.md, marginTop: S.md, borderTopWidth: 1, borderTopColor: C.border,
  },
  collapseBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textSecondary },

  actionsRow: { flexDirection: 'row', gap: S.sm, marginTop: S.xl },
  outlineBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs,
  },
  outlineBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
});
