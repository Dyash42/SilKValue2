import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const RED = '#EF4444';
const AMBER = '#F59E0B';
const TEXT_SECONDARY = '#666666';

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
    paddingHorizontal: 16,
    backgroundColor: WHITE,
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotAmber: {
    backgroundColor: AMBER,
  },
  dotRed: {
    backgroundColor: RED,
  },
  textGrey: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: RED,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: RED,
  },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: BLACK,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: WHITE,
  },
});
