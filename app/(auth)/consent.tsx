import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function ConsentScreen() {
  const [dataSharing, setDataSharing] = useState(false);

  const handleAccept = () => {
    // TODO: write consent record to consent_logs table
    // { terms_version, consent_timestamp, user_id, data_sharing_consent }
    router.replace('/(reeler)/onboarding/basic-details');
  };

  const handleDecline = () => {
    Alert.alert(
      'Cannot Continue',
      'You cannot use Silk Value without accepting the terms. Your session will be cleared.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Decline & Exit',
          style: 'destructive',
          onPress: () => {
            // Clear session → back to login
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Data & Consent</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconBlock}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={32} color={C.textPrimary} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>What data we collect</Text>
        <View style={styles.listBlock}>
          {[
            'Your name and contact information',
            'Last 4 digits of Aadhaar (never full number)',
            'Bank account / UPI details for payments',
            'GPS location of your farm',
            'Collection records and payment history',
          ].map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>How we use it</Text>
        <Text style={styles.bodyText}>
          Your data is used to process payments, verify your identity, generate collection receipts,
          and provide income reports. We follow DPDP Act guidelines for all data handling.
        </Text>

        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>Terms Version</Text>
          <Text style={styles.versionValue}>v2.1</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Share anonymised data</Text>
            <Text style={styles.toggleDesc}>Allow sharing with banks/NGOs for income proof</Text>
          </View>
          <Switch
            value={dataSharing}
            onValueChange={setDataSharing}
            trackColor={{ false: C.border, true: C.black }}
            thumbColor={C.white}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
          <Text style={styles.acceptBtnText}>Accept & Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} activeOpacity={0.85}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
      </View>
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

  scrollContent: { padding: S.xl, paddingBottom: S['2xl'] },

  iconBlock: { alignItems: 'center', marginBottom: S.xl },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: S.md, marginTop: S.lg,
  },

  listBlock: { gap: S.sm, marginBottom: S.base },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.black, marginTop: 6 },
  listText: { flex: 1, fontSize: T.md, color: C.textPrimary, lineHeight: 22 },

  bodyText: { fontSize: T.md, color: C.textSecondary, lineHeight: 22, marginBottom: S.base },

  versionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: S.md, borderTopWidth: 1, borderTopColor: C.border,
    marginTop: S.sm,
  },
  versionLabel: { fontSize: T.base, color: C.textSecondary },
  versionValue: { fontSize: T.base, fontWeight: T.bold, color: C.textPrimary },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: S.md, borderTopWidth: 1, borderTopColor: C.border,
  },
  toggleContent: { flex: 1 },
  toggleLabel: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 2 },
  toggleDesc: { fontSize: T.base, color: C.textSecondary },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg, gap: S.sm },
  acceptBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  acceptBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
  declineBtn: {
    borderRadius: R.lg, paddingVertical: 14, alignItems: 'center',
  },
  declineBtnText: { color: C.red, fontSize: T.md, fontWeight: T.semibold },
});
