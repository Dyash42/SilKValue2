import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

type PaymentMode = 'instant_upi' | 'instant_bank' | 'weekly_batch';

const MODES: { key: PaymentMode; label: string; desc: string }[] = [
  { key: 'instant_upi', label: 'Instant UPI', desc: 'Pay directly to your UPI ID' },
  { key: 'instant_bank', label: 'Bank Transfer', desc: 'NEFT/IMPS to your bank account' },
  { key: 'weekly_batch', label: 'Weekly Batch', desc: 'Processed every Friday' },
];

export default function BankSetupScreen() {
  const [mode, setMode] = useState<PaymentMode>('instant_upi');
  const [upiId, setUpiId] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');

  const handleSave = () => {
    if (mode === 'instant_upi' && !upiId.includes('@')) {
      Alert.alert('Invalid UPI', 'Enter a valid UPI ID (e.g., name@upi).');
      return;
    }
    if (mode !== 'instant_upi' && (!accountNo || !ifsc)) {
      Alert.alert('Required', 'Please enter account number and IFSC code.');
      return;
    }
    router.push('/(reeler)/setup/qr-card');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 3/3 */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <Text style={styles.stepText}>Step 3 of 3</Text>
        </View>

        {/* Payment mode selector */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeCard, mode === m.key && styles.modeCardActive]}
            onPress={() => setMode(m.key)}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, mode === m.key && styles.radioActive]}>
              {mode === m.key && <View style={styles.radioInner} />}
            </View>
            <View style={styles.modeContent}>
              <Text style={[styles.modeLabel, mode === m.key && { color: C.white }]}>{m.label}</Text>
              <Text style={[styles.modeDesc, mode === m.key && { color: '#CCCCCC' }]}>{m.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Conditional fields */}
        {mode === 'instant_upi' ? (
          <>
            <Text style={styles.label}>UPI ID</Text>
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="yourname@upi"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>ACCOUNT NUMBER</Text>
            <TextInput
              style={styles.input}
              value={accountNo}
              onChangeText={setAccountNo}
              placeholder="Enter account number"
              placeholderTextColor={C.textMuted}
              keyboardType="numeric"
            />

            <Text style={styles.label}>IFSC CODE</Text>
            <TextInput
              style={styles.input}
              value={ifsc}
              onChangeText={(t) => setIfsc(t.toUpperCase())}
              placeholder="ABCD0001234"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>ACCOUNT HOLDER NAME</Text>
            <TextInput
              style={styles.input}
              value={holderName}
              onChangeText={setHolderName}
              placeholder="As per bank records"
              placeholderTextColor={C.textMuted}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save & Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.push('/(reeler)/setup/qr-card')}
        >
          <Text style={styles.skipBtnText}>Skip for now</Text>
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

  scrollContent: { padding: S.xl, paddingBottom: S['3xl'] },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xl },
  stepDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.black },
  stepText: { fontSize: T.base, color: C.textMuted, marginLeft: S.sm },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.md,
  },

  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.md, marginBottom: S.sm, backgroundColor: C.white,
  },
  modeCardActive: { backgroundColor: C.black, borderColor: C.black },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.white },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.white },
  modeContent: { flex: 1 },
  modeLabel: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 2 },
  modeDesc: { fontSize: T.base, color: C.textSecondary },

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.lg,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 14,
    fontSize: T.md, color: C.textPrimary,
  },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg, gap: S.sm },
  saveBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipBtnText: { color: C.textSecondary, fontSize: T.md, fontWeight: T.medium },
});
