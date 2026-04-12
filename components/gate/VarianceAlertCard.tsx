import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '@/components/shared/Badge';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface VarianceAlertCardProps {
  vehiclePlate: string;
  routeName?: string;
  variancePct: number;
  tolerancePct: number;
  onPress?: () => void;
}

export default function VarianceAlertCard({
  vehiclePlate,
  routeName,
  variancePct,
  tolerancePct,
  onPress,
}: VarianceAlertCardProps) {
  const severity = Math.abs(variancePct) > tolerancePct * 2 ? 'error' : 'warning';
  const varianceColor: string = severity === 'error' ? C.red : C.amber;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!onPress}>
      <View style={styles.left}>
        <Text style={styles.plate}>{vehiclePlate}</Text>
        {routeName ? <Text style={styles.route}>{routeName}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.variance, { color: varianceColor }]}>
          {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
        </Text>
        <Badge
          label={`Tolerance: ${tolerancePct}%`}
          variant={severity === 'error' ? 'error' : 'warning'}
        />
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.base, marginBottom: S.sm, backgroundColor: C.white,
  },
  left: { flex: 1 },
  plate: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  route: { fontSize: T.base, color: C.textSecondary },
  right: { alignItems: 'flex-end', marginRight: S.sm },
  variance: { fontSize: T['2xl'], fontWeight: T.bold, marginBottom: 4 },
});
