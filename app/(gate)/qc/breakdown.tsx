import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PerReelerRow from '@/components/gate/PerReelerRow';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Mock per-reeler data (would come from collection_tickets joined to route)
const MOCK_REELERS = [
  { name: 'Rajesh Kumar', fieldKg: 28.5, acceptedKg: 27.8, deductionKg: 0.7, amount: 13344, isSkipped: false },
  { name: 'Sita Devi', fieldKg: 22.0, acceptedKg: 21.5, deductionKg: 0.5, amount: 10320, isSkipped: false },
  { name: 'Venkat Rao', fieldKg: 0, acceptedKg: 0, deductionKg: 0, amount: 0, isSkipped: true },
  { name: 'Laxmi Bai', fieldKg: 35.0, acceptedKg: 34.2, deductionKg: 0.8, amount: 16416, isSkipped: false },
  { name: 'Mohan Singh', fieldKg: 18.0, acceptedKg: 17.5, deductionKg: 0.5, amount: 8400, isSkipped: false },
];

export default function AcceptanceBreakdownScreen() {
  const params = useLocalSearchParams<{
    entryId: string; netWeightKg: string; deductionKg: string; finalAcceptedKg: string; decision: string;
  }>();

  const netWeight = parseFloat(params.netWeightKg ?? '0');
  const totalDeduction = parseFloat(params.deductionKg ?? '0');
  const finalAccepted = parseFloat(params.finalAcceptedKg ?? '0');
  const payableReelers = MOCK_REELERS.filter(r => !r.isSkipped).length;

  const handleFinalise = () => {
    Alert.alert(
      'Finalise Entry',
      `This will trigger payments for ${payableReelers} reelers and update the ledger. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalise',
          onPress: () => {
            // Mock: set gate_entries.ledger_updated = true, create payments
            Alert.alert('Finalised', 'Entry has been finalised. Payments triggered successfully.', [
              { text: 'OK', onPress: () => router.push('/(gate)/dashboard') },
            ]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Acceptance Breakdown</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gate Net</Text>
            <Text style={styles.summaryValue}>{netWeight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Deduction</Text>
            <Text style={[styles.summaryValue, { color: C.red }]}>{totalDeduction.toFixed(1)} kg</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Accepted</Text>
            <Text style={[styles.summaryValue, { color: C.green }]}>{finalAccepted.toFixed(1)} kg</Text>
          </View>
        </View>

        {/* Per-reeler table */}
        <Text style={styles.sectionLabel}>PER-REELER BREAKDOWN</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, { flex: 1 }]}>Reeler</Text>
          <Text style={[styles.thText, { width: 50, textAlign: 'right' }]}>Field</Text>
          <Text style={[styles.thText, { width: 50, textAlign: 'right' }]}>Accpt</Text>
          <Text style={[styles.thText, { width: 50, textAlign: 'right' }]}>Deduct</Text>
          <Text style={[styles.thText, { width: 64, textAlign: 'right' }]}>Amount</Text>
        </View>
        {MOCK_REELERS.map((r, i) => (
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

        {/* Payment trigger row */}
        <View style={styles.paymentInfo}>
          <Ionicons name="card-outline" size={18} color={C.textPrimary} />
          <View style={styles.paymentInfoContent}>
            <Text style={styles.paymentInfoTitle}>Payment will be triggered for {payableReelers} reelers</Text>
            <Text style={styles.paymentInfoSub}>Instant UPI payments trigger on finalisation. Weekly batch on schedule.</Text>
          </View>
        </View>

        {/* Finalise button */}
        <TouchableOpacity style={styles.finaliseBtn} onPress={handleFinalise} activeOpacity={0.85}>
          <Text style={styles.finaliseBtnText}>Finalise & Trigger Payments</Text>
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
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  summaryRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.xl },
  summaryItem: {
    flex: 1, backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: S.md, alignItems: 'center',
  },
  summaryLabel: { fontSize: T.xs, fontWeight: T.semibold, color: C.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: T.xl, fontWeight: T.bold, color: C.textPrimary },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.sm,
  },
  tableHeader: { flexDirection: 'row', paddingVertical: S.sm, borderBottomWidth: 2, borderBottomColor: C.textPrimary, gap: 4 },
  thText: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.5 },

  paymentInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    backgroundColor: C.surfaceAlt, borderRadius: R.lg, padding: S.md,
    marginTop: S.xl, marginBottom: S.lg,
  },
  paymentInfoContent: { flex: 1 },
  paymentInfoTitle: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 4 },
  paymentInfoSub: { fontSize: T.base, color: C.textSecondary, lineHeight: 18 },

  finaliseBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  finaliseBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
