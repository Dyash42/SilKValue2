import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share as RNShare } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TicketReceiptCard from '@/components/collector/TicketReceiptCard';
import type { TicketReceiptData } from '@/components/collector/TicketReceiptCard';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TicketConfirmScreen() {
  const params = useLocalSearchParams<{
    ticketId: string; grossKg: string; tareKg: string; netKg: string;
    grade: string; pricePerKg: string; totalAmount: string;
    routeId: string; stopId: string;
  }>();

  const data: TicketReceiptData = {
    ticketId: params.ticketId ?? 'TKT-000',
    dateTime: new Date().toLocaleString('en-IN'),
    reelerName: 'Reeler',
    village: 'Village',
    grossKg: parseFloat(params.grossKg ?? '0'),
    tareKg: parseFloat(params.tareKg ?? '0'),
    netKg: parseFloat(params.netKg ?? '0'),
    grade: params.grade ?? 'A',
    pricePerKg: parseFloat(params.pricePerKg ?? '0'),
    totalAmount: parseFloat(params.totalAmount ?? '0'),
    paymentMode: 'Instant UPI',
    isSynced: false,
  };

  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Silk Value Ticket\n#${data.ticketId}\nReeler: ${data.reelerName}\nNet: ${data.netKg} kg | Grade: ${data.grade}\nAmount: ${fmt(data.totalAmount)}`,
      });
    } catch { /* swallow */ }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header — no back arrow */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collection Ticket</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TicketReceiptCard data={data} />

        {/* Actions */}
        <TouchableOpacity style={styles.outlineBtn} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-outline" size={18} color={C.textPrimary} />
          <Text style={styles.outlineBtnText}>Share Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (params.routeId) {
              router.push(`/(collector)/routes/${params.routeId}`);
            } else {
              router.push('/(collector)/dashboard');
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Back to Route</Text>
        </TouchableOpacity>

        {/* Next stop prompt */}
        <TouchableOpacity style={styles.nextPrompt} activeOpacity={0.8}>
          <Text style={styles.nextPromptText}>Next stop →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { alignItems: 'center', paddingVertical: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  outlineBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, marginTop: S.lg, marginBottom: S.sm,
  },
  outlineBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },
  primaryBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: S.md,
  },
  primaryBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.white },

  nextPrompt: { alignItems: 'center', paddingVertical: S.md },
  nextPromptText: { fontSize: T.md, fontWeight: T.semibold, color: C.textSecondary },
});
