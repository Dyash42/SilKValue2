import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { getTodayEntries } from '@/services/gate.service';
import Badge from '@/components/shared/Badge';
import type { GateEntryRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function ProfileScreen() {
  const { profile } = useAuth();
  const { pendingCount } = useSync();
  const [entries, setEntries] = useState<GateEntryRow[]>([]);

  const loadEntries = useCallback(async () => {
    if (!profile?.user_id) return;
    try { setEntries(await getTodayEntries(profile.user_id)); } catch { /* silent */ }
  }, [profile?.user_id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const name = profile?.full_name ?? 'Gate Operator';
  const phone = profile?.phone ?? '—';
  const initials = name.slice(0, 2).toUpperCase();
  const employeeId = (profile as any)?.employee_id ?? '—';
  const cluster = (profile as any)?.cluster_id ?? '—';
  const verified = profile?.kyc_status === 'verified';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // Today's stats
  const entriesProcessed = entries.length;
  const avgVariance = entries.length > 0
    ? (entries.reduce((s, e) => s + Math.abs(e.variance_percent ?? 0), 0) / entries.length).toFixed(1)
    : '0.0';
  const overrides = entries.filter(e => e.override_status != null && e.override_status !== 'none').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <Badge label="GATE OPERATOR" variant="outline" />
        </View>

        {/* Identity card */}
        <View style={styles.card}>
          <Row label="Employee ID" value={employeeId} />
          <Row label="Cluster" value={cluster} />
          <View style={styles.statusRow}>
            <Text style={styles.rowLabel}>Account Status</Text>
            <Badge label={verified ? 'VERIFIED' : 'PENDING'} variant={verified ? 'success' : 'warning'} />
          </View>
        </View>

        {/* Today's Stats */}
        <View style={[styles.card, { backgroundColor: C.surfaceAlt }]}>
          <Text style={styles.cardLabel}>TODAY'S STATS</Text>
          <Row label="Entries Processed" value={String(entriesProcessed)} />
          <Row label="Avg Variance" value={`${avgVariance}%`} />
          <Row label="Overrides Raised" value={String(overrides)} noBorder />
        </View>

        {/* Menu */}
        <View style={styles.menuBlock}>
          <MenuItem label="Settings" onPress={() => router.push('/(gate)/settings')} />
          <MenuItem label="Shift Report" onPress={() => router.push('/(gate)/reports')} />
          <MenuItem label="Help & Support" onPress={() => Linking.openURL('https://wa.me/919876543210')} />
          <View style={styles.menuRow}>
            <Text style={styles.menuLabel}>App Version</Text>
            <Text style={styles.menuValue}>{version}</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => router.push('/(gate)/logout-modal')} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, noBorder }: { label: string; value: string; noBorder?: boolean }) {
  return (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.base, paddingVertical: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  avatarBlock: { alignItems: 'center', marginBottom: S.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.black,
    alignItems: 'center', justifyContent: 'center', marginBottom: S.md,
  },
  initialsText: { color: C.white, fontSize: T['4xl'], fontWeight: T.bold },
  name: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  phone: { fontSize: T.md, color: C.textSecondary, marginBottom: S.sm },

  card: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.base, marginBottom: S.md,
  },
  cardLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textMuted, letterSpacing: 0.8, marginBottom: S.xs },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
  },
  rowLabel: { fontSize: T.base, color: C.textSecondary },
  rowValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  menuBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.xl,
  },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  menuLabel: { fontSize: T.md, color: C.textPrimary },
  menuValue: { fontSize: T.base, color: C.textMuted },

  signOutBtn: {
    borderWidth: 1, borderColor: C.red, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  signOutText: { fontSize: T.lg, fontWeight: T.bold, color: C.red },
});
