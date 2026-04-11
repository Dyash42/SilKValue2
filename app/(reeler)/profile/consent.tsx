import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function ConsentPrivacyScreen() {
  const [dataSharing, setDataSharing] = useState(false);

  const handleDownloadData = () => {
    Alert.alert('Export Data', 'Your data export will be prepared and shared via the system share dialog.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Request Account Deletion',
      'This will send a deletion request to privacy@silkvalue.in. Your account will not be automatically deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', style: 'destructive', onPress: () => {
          Alert.alert('Request Sent', 'A deletion request has been sent to our privacy team.');
        }},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consent & Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Consent version */}
        <View style={styles.infoCard}>
          <Ionicons name="checkmark-circle" size={20} color={C.greenText} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Terms Accepted</Text>
            <Text style={styles.infoSub}>Version v2.1 — Accepted on 15 Jan 2024</Text>
          </View>
        </View>

        {/* Data sharing toggle */}
        <Text style={styles.sectionLabel}>DATA SHARING</Text>
        <View style={styles.toggleCard}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Share anonymised data with banks/NGOs</Text>
            <Text style={styles.toggleDesc}>
              When enabled, your anonymised collection volume and income data may be shared
              with partnering banks and NGOs to help you build a verifiable income proof.
              No personal identification data is ever shared.
            </Text>
          </View>
          <Switch
            value={dataSharing}
            onValueChange={setDataSharing}
            trackColor={{ false: C.border, true: C.black }}
            thumbColor={C.white}
          />
        </View>

        {/* View consent history */}
        <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={18} color={C.textPrimary} />
          <Text style={styles.linkText}>View Consent History</Text>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        {/* Actions */}
        <Text style={styles.sectionLabel}>YOUR DATA</Text>
        <TouchableOpacity style={styles.actionRow} onPress={handleDownloadData} activeOpacity={0.7}>
          <View style={styles.actionIcon}>
            <Ionicons name="download-outline" size={18} color={C.textPrimary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionLabel}>Download My Data</Text>
            <Text style={styles.actionDesc}>Export all your data as a JSON file</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionRow, styles.actionRowDestructive]} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <View style={[styles.actionIcon, { backgroundColor: C.redBg }]}>
            <Ionicons name="trash-outline" size={18} color={C.redText} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionLabel, { color: C.redText }]}>Delete Account / Request Erasure</Text>
            <Text style={styles.actionDesc}>Sends a request to our privacy team</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>
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

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    borderWidth: 1, borderColor: C.greenText, borderRadius: R.lg,
    backgroundColor: C.greenBg, padding: S.md, marginBottom: S.lg,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: T.md, fontWeight: T.bold, color: C.greenText, marginBottom: 2 },
  infoSub: { fontSize: T.base, color: C.greenText },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.md, marginTop: S.sm,
  },

  toggleCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.md, marginBottom: S.base, backgroundColor: C.white,
  },
  toggleContent: { flex: 1 },
  toggleLabel: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: S.xs },
  toggleDesc: { fontSize: T.base, color: C.textSecondary, lineHeight: 20 },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: S.lg,
  },
  linkText: { flex: 1, fontSize: T.md, fontWeight: T.medium, color: C.textPrimary },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  actionRowDestructive: { borderBottomWidth: 0 },
  actionIcon: {
    width: 36, height: 36, borderRadius: R.md,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  actionContent: { flex: 1 },
  actionLabel: { fontSize: T.md, fontWeight: T.medium, color: C.textPrimary, marginBottom: 2 },
  actionDesc: { fontSize: T.base, color: C.textSecondary },
});
