import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface SyncStatusBarProps {
  isSyncing: boolean;
  pendingCount?: number;
  error?: string | null;
  onSync?: () => void;
  onRetry?: () => void;
}

export default function SyncStatusBar({
  isSyncing,
  pendingCount = 0,
  error,
  onSync,
  onRetry,
}: SyncStatusBarProps) {
  // Fully synced and no error — return null (invisible)
  if (!isSyncing && !error && pendingCount === 0) {
    return null;
  }

  if (error) {
    return (
      <View style={styles.bar}>
        <View style={[styles.dot, styles.dotRed]} />
        <Text style={styles.textGrey} numberOfLines={1}>
          {error}
        </Text>
        {onRetry ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onRetry}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={styles.bar}>
        <View style={[styles.dot, styles.dotAmber]} />
        <Text style={styles.textGrey}>SYNCING</Text>
      </View>
    );
  }

  // pendingCount > 0
  return (
    <View style={styles.bar}>
      <Text style={styles.textGrey}>{'\u2191'} {pendingCount} pending</Text>
      {onSync ? (
        <TouchableOpacity style={styles.syncBtn} onPress={onSync}>
          <Text style={styles.syncBtnText}>Sync</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.base,
    backgroundColor: C.white,
    gap: S.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: R.full,
  },
  dotAmber: {
    backgroundColor: C.amber,
  },
  dotRed: {
    backgroundColor: C.red,
  },
  textGrey: {
    flex: 1,
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.textSecondary,
    letterSpacing: 0.5,
  },
  actionBtn: {
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.red,
  },
  actionBtnText: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.red,
  },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: R.sm,
    backgroundColor: C.black,
  },
  syncBtnText: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.white,
  },
});
