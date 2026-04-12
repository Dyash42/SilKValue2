import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Badge from '@/components/shared/Badge';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface WeighmentSummaryProps {
  fieldWeightKg: number;
  factoryWeightKg: number;
  variancePct?: number | null;
  varianceKg?: number | null;
  vehiclePlate?: string;
  routeName?: string;
  tolerancePct?: number;
}

export default function WeighmentSummary({
  fieldWeightKg, factoryWeightKg, variancePct, varianceKg, vehiclePlate, routeName, tolerancePct,
}: WeighmentSummaryProps) {
  const isNegative = (variancePct ?? 0) < 0 || (varianceKg ?? 0) < 0;
  const isOutOfTolerance = tolerancePct != null && variancePct != null && Math.abs(variancePct) > tolerancePct;

  const varianceLabel =
    variancePct != null && varianceKg != null
      ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}% (${varianceKg > 0 ? '+' : ''}${varianceKg.toFixed(1)} kg)`
      : variancePct != null
      ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}%`
      : varianceKg != null
      ? `${varianceKg > 0 ? '+' : ''}${varianceKg.toFixed(1)} kg`
      : '—';

  return (
    <View style={styles.container}>
      {/* Two weight cards side by side */}
      <View style={styles.cardsRow}>
        <View style={styles.weightCard}>
          <Text style={styles.weightCardLabel}>FIELD WEIGHT</Text>
          <Text style={styles.weightCardValue}>{fieldWeightKg.toFixed(2)}</Text>
          <Text style={styles.weightCardUnit}>kg</Text>
        </View>
        <View style={styles.weightCard}>
          <Text style={styles.weightCardLabel}>GATE WEIGHT</Text>
          <Text style={styles.weightCardValue}>{factoryWeightKg.toFixed(2)}</Text>
          <Text style={styles.weightCardUnit}>kg</Text>
        </View>
      </View>

      {/* Variance row */}
      <View style={styles.varianceRow}>
        <Text style={styles.varianceLabel}>Variance</Text>
        <Text style={[styles.varianceValue, isNegative && { color: C.red }]}>
          {varianceLabel}
        </Text>
      </View>

      {/* Tolerance badge */}
      {tolerancePct != null && variancePct != null && (
        <View style={styles.badgeRow}>
          <Badge
            label={isOutOfTolerance ? 'OUTSIDE TOLERANCE' : 'WITHIN TOLERANCE'}
            variant={isOutOfTolerance ? 'error' : 'success'}
          />
        </View>
      )}

      {/* Vehicle / route */}
      {(vehiclePlate || routeName) && (
        <View style={styles.metaRow}>
          {vehiclePlate ? <Text style={styles.metaText}>{vehiclePlate}</Text> : null}
          {routeName ? <Text style={styles.metaText}>{routeName}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: S.md },
  cardsRow: { flexDirection: 'row', gap: S.md, marginBottom: S.md },
  weightCard: {
    flex: 1, backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: 14, alignItems: 'flex-start',
  },
  weightCardLabel: {
    fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
  },
  weightCardValue: { fontSize: 24, fontWeight: T.bold, color: C.textPrimary },
  weightCardUnit: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  varianceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: S.md, borderTopWidth: 1, borderTopColor: C.border,
  },
  varianceLabel: { fontSize: T.md, color: C.textSecondary },
  varianceValue: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },
  badgeRow: { marginBottom: S.sm },
  metaRow: { flexDirection: 'row', gap: S.md, marginTop: S.xs },
  metaText: { fontSize: T.base, color: C.textMuted },
});
