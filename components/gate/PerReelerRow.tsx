import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Badge from '@/components/shared/Badge';
import { DT } from '@/constants/designTokens';

const { C, T, S } = { C: DT.colors, T: DT.type, S: DT.space };

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface PerReelerRowProps {
  reelerName: string;
  fieldQtyKg: number | null;
  acceptedQtyKg: number | null;
  deductionKg: number | null;
  amount: number | null;
  isSkipped: boolean;
}

export default function PerReelerRow({
  reelerName, fieldQtyKg, acceptedQtyKg, deductionKg, amount, isSkipped,
}: PerReelerRowProps) {
  const muted = isSkipped;
  return (
    <View style={styles.row}>
      <Text style={[styles.name, muted && styles.muted]} numberOfLines={1}>{reelerName}</Text>
      <Text style={[styles.cell, muted && styles.muted]}>
        {!muted && fieldQtyKg != null ? `${fieldQtyKg.toFixed(1)}` : '—'}
      </Text>
      <Text style={[styles.cell, muted && styles.muted]}>
        {!muted && acceptedQtyKg != null ? `${acceptedQtyKg.toFixed(1)}` : '—'}
      </Text>
      <Text style={[styles.cell, muted && styles.muted]}>
        {!muted && deductionKg != null ? `${deductionKg.toFixed(1)}` : '—'}
      </Text>
      {isSkipped ? (
        <View style={styles.amountCol}><Badge label="SKIPPED" variant="grey" /></View>
      ) : (
        <Text style={styles.amount}>{amount != null ? fmt(amount) : '—'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  name: { flex: 1, fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  cell: { fontSize: T.base, color: C.textSecondary, width: 50, textAlign: 'right' },
  amount: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary, width: 64, textAlign: 'right' },
  amountCol: { width: 64, alignItems: 'flex-end' },
  muted: { color: C.textMuted },
});
