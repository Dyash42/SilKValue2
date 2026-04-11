import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '@/stores/sync.store';
import { formatRelativeTime } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function SettingRow({
  icon, label, value, onPress, destructive,
}: {
  icon: string; label: string; value?: string; onPress: () => void; destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, destructive && { backgroundColor: C.redBg }]}>
        <Ionicons name={icon as any} size={18} color={destructive ? C.redText : C.textPrimary} />
      </View>
      <Text style={[styles.settingLabel, destructive && { color: C.redText }]}>{label}</Text>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {!destructive && <Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon, label, desc, value, onToggle,
}: {
  icon: string; label: string; desc: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={18} color={C.textPrimary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.black }}
        thumbColor={C.white}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache?',
      'This will delete all locally cached data. Your account and cloud data will not be affected. The app will re-sync after clearing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => { Alert.alert('Cache Cleared', 'Local data has been cleared. Syncing will restart.'); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>SYNC & DATA</Text>
        <View style={styles.group}>
          <ToggleRow
            icon="cloud-offline-outline"
            label="Offline Mode"
            desc="Aggressively cache data for offline access"
            value={offlineMode}
            onToggle={setOfflineMode}
          />
          <ToggleRow
            icon="sync-outline"
            label="Auto Sync"
            desc="Sync data automatically in the background"
            value={autoSync}
            onToggle={setAutoSync}
          />
        </View>

        {/* Last sync time */}
        <View style={styles.syncInfo}>
          <Ionicons name="time-outline" size={14} color={C.textMuted} />
          <Text style={styles.syncInfoText}>
            Last synced: {lastSyncedAt ? formatRelativeTime(lastSyncedAt) : 'Never'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.group}>
          <ToggleRow
            icon="notifications-outline"
            label="Push Notifications"
            desc="Collection receipts, payment alerts"
            value={notifications}
            onToggle={setNotifications}
          />
        </View>

        <Text style={styles.sectionLabel}>STORAGE</Text>
        <View style={styles.group}>
          <SettingRow
            icon="trash-outline"
            label="Clear Cache"
            onPress={handleClearCache}
          />
        </View>

        {/* Logout */}
        <View style={[styles.group, { marginTop: S['2xl'] }]}>
          <SettingRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={() => router.push('/(reeler)/profile/logout-modal')}
            destructive
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },

  scrollContent: { padding: S.base, paddingBottom: S['3xl'] },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.sm, marginTop: S.lg,
  },

  group: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', backgroundColor: C.white,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingHorizontal: S.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  settingIcon: {
    width: 32, height: 32, borderRadius: R.sm,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { flex: 1, fontSize: T.md, fontWeight: T.medium, color: C.textPrimary },
  settingDesc: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  settingValue: { fontSize: T.base, color: C.textSecondary, marginRight: S.xs },

  syncInfo: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    paddingHorizontal: S.xs, paddingTop: S.sm,
  },
  syncInfoText: { fontSize: T.base, color: C.textMuted },
});
