import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ? (
        <Text style={styles.icon}>{icon}</Text>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S['2xl'],
    paddingVertical: S['3xl'],
  },
  icon: {
    fontSize: 48,
    marginBottom: S.base,
    textAlign: 'center',
  },
  title: {
    fontSize: T['2xl'],
    fontWeight: T.bold,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: S.sm,
  },
  subtitle: {
    fontSize: T.md,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: S.xl,
  },
  button: {
    borderWidth: 1,
    borderColor: C.black,
    borderRadius: R.md,
    paddingHorizontal: S.xl,
    paddingVertical: 11,
    backgroundColor: C.white,
    marginTop: S.sm,
  },
  buttonText: {
    fontSize: T.md,
    fontWeight: T.semibold,
    color: C.black,
  },
});
