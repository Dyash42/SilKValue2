import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

// Design system colors
const BG = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';

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
    backgroundColor: BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 38,
  },
  unit: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginLeft: 4,
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 4,
  },
});
