import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface ShiftStatRowProps {
  label: string;
  value: string;
  unit?: string;
}

export default function ShiftStatRow({ label, value, unit }: ShiftStatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  label: { fontSize: T.md, color: C.textSecondary },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },
  unit: { fontSize: T.base, color: C.textMuted },
});
