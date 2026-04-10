import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GREEN = '#22C55E';
const RED = '#EF4444';
const AMBER = '#F59E0B';
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_SECONDARY = '#666666';

export type BadgeVariant = 'black' | 'outline' | 'success' | 'error' | 'warning' | 'grey';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = 'outline' }: BadgeProps) {
  return (
    <View style={[styles.base, containerStyles[variant]]}>
      <Text style={[styles.text, textStyles[variant]]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

const containerStyles = StyleSheet.create({
  black: {
    backgroundColor: BLACK,
    borderColor: BLACK,
  },
  outline: {
    backgroundColor: WHITE,
    borderColor: BLACK,
  },
  success: {
    backgroundColor: '#DCFCE7',
    borderColor: GREEN,
  },
  error: {
    backgroundColor: '#FEE2E2',
    borderColor: RED,
  },
  warning: {
    backgroundColor: '#FEF3C7',
    borderColor: AMBER,
  },
  grey: {
    backgroundColor: SURFACE_ALT,
    borderColor: BORDER,
  },
});

const textStyles = StyleSheet.create({
  black: { color: WHITE },
  outline: { color: BLACK },
  success: { color: GREEN },
  error: { color: RED },
  warning: { color: AMBER },
  grey: { color: TEXT_SECONDARY },
});
