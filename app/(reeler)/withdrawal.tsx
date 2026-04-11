import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function WithdrawalScreen() {
  const { profile } = useAuthStore();
  const reeler = profile as any;
  const paymentPref = reeler?.payment_preference ?? 'instant_upi';
  const upiId = reeler?.upi_id ?? '—';

  // Mock available balance
  const availableBalance = 12500;
  const [amount, setAmount] = useState('');

  const handleWithdrawFull = () => {
    setAmount(String(availableBalance));
  };

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (val > availableBalance) {
      Alert.alert('Insufficient Balance', `Maximum withdrawable amount is ${formatCurrency(availableBalance)}.`);
      return;
    }
    // Mock success
    Alert.alert(
      'Withdrawal Requested',
      `${formatCurrency(val)} will be sent to your ${paymentPref.replace(/_/g, ' ')} account.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const modeDisplay = paymentPref.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Withdrawal</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Available balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>{formatCurrency(availableBalance)}</Text>
        </View>

        {/* Amount input */}
        <Text style={styles.label}>WITHDRAWAL AMOUNT</Text>
        <View style={styles.inputRow}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={C.textMuted}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
          />
          <TouchableOpacity style={styles.fullBtn} onPress={handleWithdrawFull}>
            <Text style={styles.fullBtnText}>Withdraw Full</Text>
          </TouchableOpacity>
        </View>

        {/* Payment method */}
        <Text style={styles.label}>RECEIVING ACCOUNT</Text>
        <View style={styles.methodCard}>
          <Ionicons name="wallet-outline" size={20} color={C.textPrimary} />
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>{modeDisplay}</Text>
            <Text style={styles.methodDetail}>{upiId}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(reeler)/profile/payment-methods')}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        {paymentPref !== 'instant_upi' && (
          <View style={styles.warningBanner}>
            <Ionicons name="information-circle-outline" size={16} color={C.amberText} />
            <Text style={styles.warningText}>
              Bank transfers may take up to 2 business days to process.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>Submit Withdrawal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
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

  scrollContent: { padding: S.base, paddingBottom: S['2xl'] },

  balanceCard: {
    backgroundColor: C.black, borderRadius: R.xl, padding: S.lg,
    alignItems: 'center', marginBottom: S.xl,
  },
  balanceLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.xs,
  },
  balanceValue: { fontSize: T['6xl'], fontWeight: T.extrabold, color: C.white },

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.md,
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.lg,
  },
  currencyPrefix: {
    paddingHorizontal: S.md, fontSize: T['2xl'], fontWeight: T.bold,
    color: C.textPrimary, borderRightWidth: 1, borderRightColor: C.border,
    paddingVertical: 14, backgroundColor: C.surfaceAlt,
  },
  amountInput: {
    flex: 1, paddingHorizontal: S.md, paddingVertical: 14,
    fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary,
  },
  fullBtn: {
    paddingHorizontal: S.md, paddingVertical: 10,
    backgroundColor: C.surfaceAlt, marginRight: S.xs,
    borderRadius: R.sm,
  },
  fullBtnText: { fontSize: T.xs, fontWeight: T.bold, color: C.textPrimary },

  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.md, marginBottom: S.md, backgroundColor: C.white,
  },
  methodContent: { flex: 1 },
  methodTitle: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 2 },
  methodDetail: { fontSize: T.base, color: C.textSecondary },
  changeLink: { fontSize: T.base, fontWeight: T.semibold, color: C.textSecondary },

  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.amberBg, borderRadius: R.md,
    padding: S.md, borderWidth: 1, borderColor: C.amber,
  },
  warningText: { flex: 1, fontSize: T.base, color: C.amberText },

  footer: { paddingHorizontal: S.base, paddingBottom: S.lg, gap: S.sm },
  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
  cancelBtn: {
    borderRadius: R.lg, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: C.textSecondary, fontSize: T.md, fontWeight: T.medium },
});
