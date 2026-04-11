import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w.charAt(0).toUpperCase()).slice(0, 2).join('');
}

function kycBadgeStyle(status: string | null | undefined) {
  if (status === 'verified') return { bg: C.greenBg, text: C.greenText, label: 'VERIFIED' };
  if (status === 'submitted') return { bg: C.amberBg, text: C.amberText, label: 'PENDING' };
  if (status === 'rejected') return { bg: C.redBg, text: C.redText, label: 'REJECTED' };
  return { bg: C.surfaceAlt, text: C.textSecondary, label: 'UNVERIFIED' };
}

// ── Menu row ──────────────────────────────────────────────────────────────────

function MenuRow({
  icon,
  label,
  onPress,
  destructive,
  badge,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={destructive ? C.redText : C.textPrimary}
        />
      </View>
      <Text style={[styles.menuLabel, destructive && { color: C.redText }]}>{label}</Text>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
      {!destructive && <Ionicons name="chevron-forward" size={16} color={C.textMuted} />}
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { profile } = useAuth();

  const name = profile?.full_name ?? 'Reeler';
  const phone = profile?.phone ?? '—';
  const kycStatus = (profile as any)?.kyc_status ?? null;
  const reelerCode = (profile as any)?.reeler_code ?? null;
  const cluster = (profile as any)?.cluster_name ?? (profile as any)?.cluster_id ?? null;
  const kyc = kycBadgeStyle(kycStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar block */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.kycBadge, { backgroundColor: kyc.bg }]}>
              <Text style={[styles.kycBadgeText, { color: kyc.text }]}>{kyc.label}</Text>
            </View>
            {reelerCode ? (
              <View style={styles.codeChip}>
                <Text style={styles.codeChipText}>{reelerCode}</Text>
              </View>
            ) : null}
          </View>

          {cluster ? (
            <Text style={styles.clusterText}>{cluster}</Text>
          ) : null}
        </View>

        {/* Account menu */}
        <SectionHeader label="ACCOUNT" />
        <View style={styles.menuGroup}>
          <MenuRow
            icon="create-outline"
            label="Edit Details"
            onPress={() => router.push('/(reeler)/profile/edit-details')}
          />
          <MenuRow
            icon="card-outline"
            label="Payment Methods"
            onPress={() => router.push('/(reeler)/profile/payment-methods')}
          />
          <MenuRow
            icon="qr-code-outline"
            label="My QR Code"
            onPress={() => router.push('/(reeler)/setup/qr-card')}
          />
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/(reeler)/notifications')}
          />
        </View>

        {/* Legal & Privacy */}
        <SectionHeader label="PRIVACY & LEGAL" />
        <View style={styles.menuGroup}>
          <MenuRow
            icon="shield-checkmark-outline"
            label="Consent & Privacy"
            onPress={() => router.push('/(reeler)/profile/consent')}
          />
        </View>

        {/* Support & Settings */}
        <SectionHeader label="SUPPORT" />
        <View style={styles.menuGroup}>
          <MenuRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => router.push('/(reeler)/profile/help')}
          />
          <MenuRow
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/(reeler)/profile/settings')}
          />
        </View>

        {/* Sign out */}
        <View style={[styles.menuGroup, styles.menuGroupLast]}>
          <MenuRow
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 32 },

  header: {
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary },

  avatarBlock: {
    alignItems: 'center',
    paddingTop: S.xl,
    paddingBottom: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.black,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.md,
  },
  avatarText: { color: C.white, fontSize: T['4xl'], fontWeight: T.bold },
  name: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 4 },
  phone: { fontSize: T.md, color: C.textSecondary, marginBottom: S.sm },
  badgeRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.xs },
  kycBadge: { borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: 4 },
  kycBadgeText: { fontSize: T.xs, fontWeight: T.bold, letterSpacing: 0.5 },
  codeChip: {
    borderRadius: R.full,
    paddingHorizontal: S.md, paddingVertical: 4,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
  },
  codeChipText: { fontSize: T.xs, fontWeight: T.semibold, color: C.textSecondary },
  clusterText: { fontSize: T.base, color: C.textMuted, marginTop: 4 },

  sectionHeader: {
    paddingHorizontal: S.base,
    paddingTop: S.lg,
    paddingBottom: S.xs,
  },
  sectionHeaderText: {
    fontSize: T.xs,
    fontWeight: T.bold,
    color: C.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  menuGroup: {
    marginHorizontal: S.base,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    backgroundColor: C.white,
  },
  menuGroupLast: { marginTop: S.base },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: S.md,
  },
  menuIcon: {
    width: 32, height: 32, borderRadius: R.sm,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconDestructive: { backgroundColor: C.redBg },
  menuLabel: { flex: 1, fontSize: T.md, fontWeight: T.medium, color: C.textPrimary },
  menuBadge: {
    backgroundColor: C.red,
    borderRadius: R.full,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: { fontSize: T.xs, fontWeight: T.bold, color: C.white },
});
