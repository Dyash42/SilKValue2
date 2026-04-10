import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Design system colors
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const RED = '#EF4444';

interface WeighmentSummaryProps {
  fieldWeightKg: number;
  factoryWeightKg: number;
  variancePct?: number | null;
  varianceKg?: number | null;
}

export default function WeighmentSummary({
  fieldWeightKg,
  factoryWeightKg,
  variancePct,
  varianceKg,
}: WeighmentSummaryProps) {
  const isNegative = (variancePct ?? 0) < 0 || (varianceKg ?? 0) < 0;

  const varianceLabel =
    variancePct != null && varianceKg != null
      ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}% (${varianceKg > 0 ? '+' : ''}${varianceKg} kg)`
      : variancePct != null
      ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}%`
      : varianceKg != null
      ? `${varianceKg > 0 ? '+' : ''}${varianceKg} kg`
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
          <Text style={styles.weightCardLabel}>FACTORY WEIGHT</Text>
          <Text style={styles.weightCardValue}>{factoryWeightKg.toFixed(2)}</Text>
          <Text style={styles.weightCardUnit}>kg</Text>
        </View>
      </View>

      {/* Variance row */}
      <View style={styles.varianceRow}>
        <Text style={styles.varianceLabel}>Variance</Text>
        <Text style={[styles.varianceValue, isNegative ? styles.varianceNegative : null]}>
          {varianceLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  weightCard: {
    flex: 1,
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 14,
    alignItems: 'flex-start',
  },
  weightCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  weightCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  weightCardUnit: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  varianceLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  varianceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  varianceNegative: {
    color: RED,
  },
});
