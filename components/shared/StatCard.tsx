import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function StatCard({ label, value, unit, caption, style, onPress }: StatCardProps) {
  const inner = (
    <>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.base,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: T['6xl'],
    fontWeight: T.bold,
    color: C.textPrimary,
    lineHeight: 38,
  },
  unit: {
    fontSize: T.base,
    color: C.textMuted,
    marginLeft: S.xs,
    marginBottom: 4,
  },
  caption: {
    fontSize: T.base,
    color: C.textMuted,
    marginTop: S.xs,
  },
});
