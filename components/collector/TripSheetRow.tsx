import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Badge from '@/components/shared/Badge';
import { DT } from '@/constants/designTokens';

const { C, T, S } = { C: DT.colors, T: DT.type, S: DT.space };

interface TripSheetRowProps {
  reelerName: string;
  weightKg: number | null;
  grade: string | null;
  amount: number | null;
  isSkipped: boolean;
}

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function TripSheetRow({ reelerName, weightKg, grade, amount, isSkipped }: TripSheetRowProps) {
  const muted = isSkipped;
  return (
    <View style={styles.row}>
      <Text style={[styles.name, muted && styles.muted]} numberOfLines={1}>{reelerName}</Text>
      <Text style={[styles.cell, muted && styles.muted]}>{weightKg != null ? `${weightKg.toFixed(1)} kg` : '—'}</Text>
      {isSkipped ? (
        <Badge label="SKIPPED" variant="grey" />
      ) : grade ? (
        <Badge label={grade} variant="black" />
      ) : (
        <Text style={styles.cell}>—</Text>
      )}
      <Text style={[styles.amount, muted && styles.muted]}>{amount != null ? fmt(amount) : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  name: { flex: 1, fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  cell: { fontSize: T.base, color: C.textSecondary, width: 60, textAlign: 'right' },
  amount: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary, width: 72, textAlign: 'right' },
  muted: { color: C.textMuted },
});
