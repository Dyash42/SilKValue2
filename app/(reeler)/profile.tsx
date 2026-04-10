import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import Badge from '@/components/shared/Badge';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const SURFACE_ALT = '#F5F5F5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const RED = '#EF4444';
const GREEN = '#22C55E';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const name = profile?.full_name ?? 'Reeler';
  const phone = profile?.phone ?? '—';
  const role = profile?.role ?? 'reeler';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <View style={styles.roleBadgeRow}>
            <Badge label={role.toUpperCase()} variant="outline" />
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoBlock}>
          <InfoRow label="Full Name" value={name} />
          <InfoRow label="Phone" value={phone} />
          <InfoRow label="Role" value={role.charAt(0).toUpperCase() + role.slice(1)} />
        </View>

        {/* KYC status */}
        <View style={styles.kycRow}>
          <Text style={styles.kycLabel}>KYC STATUS</Text>
          <Badge label="VERIFIED" variant="success" />
        </View>

        <View style={styles.spacer} />

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 40, flexGrow: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY },

  avatarBlock: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 10,
  },
  roleBadgeRow: {},

  infoBlock: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  kycRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: SURFACE_ALT,
    marginBottom: 20,
  },
  kycLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  spacer: { flex: 1, minHeight: 24 },

  signOutBtn: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: BLACK,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: RED,
  },
});
