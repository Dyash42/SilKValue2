import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSync } from '@/hooks/useSync';
import BluetoothScaleRow from '@/components/collector/BluetoothScaleRow';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function SettingsScreen() {
  const { isSyncing, triggerSync, pendingCount } = useSync();
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleSyncNow = async () => {
    try { await triggerSync(); }
    catch { Alert.alert('Sync Error', 'Failed to sync. Try again later.'); }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'This will clear all local data and re-sync from the server. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Done', 'Cache cleared.') },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* SYNC */}
        <Text style={styles.sectionLabel}>SYNC</Text>
        <View style={styles.card}>
          <ToggleRow label="Auto Sync" value={autoSync} onValueChange={setAutoSync} />
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} disabled={isSyncing} activeOpacity={0.85}>
            <Ionicons name="sync-outline" size={16} color={isSyncing ? C.textMuted : C.textPrimary} />
            <Text style={[styles.syncBtnText, isSyncing && { color: C.textMuted }]}>
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pending Records</Text>
            <Text style={styles.infoValue}>{pendingCount ?? 0}</Text>
          </View>
        </View>

        {/* BLUETOOTH */}
        <Text style={styles.sectionLabel}>BLUETOOTH</Text>
        <BluetoothScaleRow />

        {/* OFFLINE MODE */}
        <Text style={styles.sectionLabel}>OFFLINE MODE</Text>
        <View style={styles.card}>
          <ToggleRow label="Offline Mode" value={offlineMode} onValueChange={setOfflineMode} />
          {offlineMode && (
            <View style={styles.warningRow}>
              <Ionicons name="warning" size={16} color={C.amber} />
              <Text style={styles.warningText}>Tickets created in offline mode will sync when you turn this off.</Text>
            </View>
          )}
        </View>

        {/* DATA */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.destructiveBtn} onPress={handleClearCache} activeOpacity={0.85}>
            <Text style={styles.destructiveBtnText}>Clear Local Cache</Text>
          </TouchableOpacity>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>{version}</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutLink}
          onPress={() => router.push('/(collector)/logout-modal')}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.border, true: C.black }}
        thumbColor={C.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { marginRight: S.sm },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginTop: S.xl, marginBottom: S.sm,
  },
  card: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.sm,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  toggleLabel: { fontSize: T.md, color: C.textPrimary },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  syncBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 12,
  },
  infoLabel: { fontSize: T.base, color: C.textSecondary },
  infoValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  warningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.sm,
    paddingHorizontal: S.base, paddingVertical: 10,
    backgroundColor: C.amberBg,
  },
  warningText: { flex: 1, fontSize: T.base, color: C.amber, lineHeight: 18 },

  destructiveBtn: {
    paddingHorizontal: S.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  destructiveBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.red },

  signOutLink: { alignItems: 'center', paddingVertical: S.xl },
  signOutText: { fontSize: T.lg, fontWeight: T.bold, color: C.red },
});
