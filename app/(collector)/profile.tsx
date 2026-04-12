import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import Badge from '@/components/shared/Badge';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function ProfileScreen() {
  const { profile } = useAuth();
  const { routes, progress } = useRoute();
  const activeRoute = routes[0] ?? null;

  const name = profile?.full_name ?? 'Collector';
  const phone = profile?.phone ?? '—';
  const initials = name.slice(0, 2).toUpperCase();
  const employeeId = (profile as any)?.employee_id ?? '—';
  const cluster = (profile as any)?.cluster_id ?? '—';
  const verified = profile?.kyc_status === 'verified';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <Badge label="COLLECTOR" variant="outline" />
        </View>

        {/* Identity card */}
        <View style={styles.card}>
          <Row label="Full Name" value={name} />
          <Row label="Phone" value={phone} />
          <Row label="Employee ID" value={employeeId} />
          <Row label="Cluster" value={cluster} />
          <View style={styles.statusRow}>
            <Text style={styles.rowLabel}>Account Status</Text>
            <Badge label={verified ? 'VERIFIED' : 'PENDING'} variant={verified ? 'success' : 'warning'} />
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ASSIGNED VEHICLE</Text>
          <Text style={styles.cardValue}>No vehicle assigned today</Text>
        </View>

        {/* Today's route */}
        {activeRoute && (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(collector)/routes/${activeRoute.id}`)} activeOpacity={0.85}>
            <Text style={styles.cardLabel}>TODAY'S ROUTE</Text>
            <Text style={styles.cardValue}>{activeRoute.name}</Text>
            <Text style={styles.cardSub}>{progress.completedStops} of {progress.totalStops} stops completed</Text>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={styles.menuBlock}>
          <MenuItem label="Settings" onPress={() => router.push('/(collector)/settings')} />
          <MenuItem label="Help & Support" onPress={() => Linking.openURL('https://wa.me/919876543210')} />
          <View style={styles.menuRow}>
            <Text style={styles.menuLabel}>App Version</Text>
            <Text style={styles.menuValue}>{version}</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => router.push('/(collector)/logout-modal')} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
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
  initials: { color: C.white, fontSize: T['4xl'], fontWeight: T.bold },
  name: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  phone: { fontSize: T.md, color: C.textSecondary, marginBottom: S.sm },

  card: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.base, marginBottom: S.md,
  },
  cardLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textMuted, letterSpacing: 0.8, marginBottom: S.xs },
  cardValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  cardSub: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },

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
