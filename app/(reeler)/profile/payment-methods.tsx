import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase/client';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

type PaymentMethod = {
  type: 'upi' | 'bank';
  label: string;
  detail: string;
  isDefault: boolean;
};

export default function PaymentMethodsScreen() {
  const { profile } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Build methods from profile/reeler data
    const m: PaymentMethod[] = [];
    const reeler = profile as any;
    const pref = reeler?.payment_preference ?? 'instant_upi';

    if (reeler?.upi_id) {
      m.push({
        type: 'upi', label: 'UPI', detail: reeler.upi_id,
        isDefault: pref === 'instant_upi',
      });
    }
    if (reeler?.bank_account_masked) {
      m.push({
        type: 'bank', label: 'Bank Account',
        detail: `XXXX-${reeler.bank_account_masked}`,
        isDefault: pref === 'instant_bank' || pref === 'weekly_batch',
      });
    }
    if (m.length === 0) {
      // Placeholder
      m.push({ type: 'upi', label: 'UPI', detail: 'Not configured', isDefault: true });
    }
    setMethods(m);
    setIsLoading(false);
  }, [profile]);

  const handleSetDefault = useCallback((index: number) => {
    setMethods((prev) => prev.map((m, i) => ({ ...m, isDefault: i === index })));
    // TODO: update reelers.payment_preference via supabase
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.black} />
        </View>
      ) : (
        <FlatList
          data={methods}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.methodCard}>
              <View style={styles.methodIcon}>
                <Ionicons
                  name={item.type === 'upi' ? 'phone-portrait-outline' : 'business-outline'}
                  size={20}
                  color={C.textPrimary}
                />
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodLabel}>{item.label}</Text>
                <Text style={styles.methodDetail}>{item.detail}</Text>
              </View>
              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setDefaultBtn}
                  onPress={() => handleSetDefault(index)}
                >
                  <Text style={styles.setDefaultBtnText}>Set Default</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(reeler)/setup/bank-setup')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color={C.white} />
              <Text style={styles.addBtnText}>Add Payment Method</Text>
            </TouchableOpacity>
          }
        />
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: S.base, gap: S.sm },

  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.md, backgroundColor: C.white,
  },
  methodIcon: {
    width: 40, height: 40, borderRadius: R.md,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  methodContent: { flex: 1 },
  methodLabel: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 2 },
  methodDetail: { fontSize: T.base, color: C.textSecondary },

  defaultBadge: {
    backgroundColor: C.black, borderRadius: R.sm,
    paddingHorizontal: S.sm, paddingVertical: 4,
  },
  defaultBadgeText: { fontSize: T.xs, fontWeight: T.bold, color: C.white, letterSpacing: 0.5 },
  setDefaultBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.sm,
    paddingHorizontal: S.sm, paddingVertical: 4,
  },
  setDefaultBtnText: { fontSize: T.xs, fontWeight: T.semibold, color: C.textSecondary },

  addBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: S.sm, marginTop: S.lg,
  },
  addBtnText: { color: C.white, fontSize: T.md, fontWeight: T.bold },
});
