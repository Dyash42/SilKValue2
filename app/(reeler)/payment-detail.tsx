import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import type { PaymentRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function statusStyle(s: string | null) {
  if (s === 'success') return { bg: C.greenBg, text: C.greenText, label: 'PAID' };
  if (s === 'pending') return { bg: C.amberBg, text: C.amberText, label: 'PENDING' };
  if (s === 'processing') return { bg: C.blueBg, text: C.blueText, label: 'PROCESSING' };
  if (s === 'failed') return { bg: C.redBg, text: C.redText, label: 'FAILED' };
  return { bg: C.surfaceAlt, text: C.textSecondary, label: (s ?? 'UNKNOWN').toUpperCase() };
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function PaymentDetailScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) { setError('No payment ID.'); setIsLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error: e } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId as string)
          .single();
        if (e) throw new Error(e.message);
        if (!cancelled) setPayment(data as PaymentRow);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load payment.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paymentId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Details</Text>
        </View>
        <View style={styles.centered}><ActivityIndicator size="large" color={C.black} /></View>
      </SafeAreaView>
    );
  }

  if (error || !payment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Details</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={styles.errorText}>{error ?? 'Payment not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ss = statusStyle(payment.payment_status as string | null);
  const amount = payment.amount ?? 0;
  const mode = (payment.payment_mode ?? '').replace(/_/g, ' ').toUpperCase() || '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount + status */}
        <View style={styles.amountBlock}>
          <Text style={styles.amountText}>{formatCurrency(amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
            <Text style={[styles.statusBadgeText, { color: ss.text }]}>{ss.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailBlock}>
          <DetailRow label="PAYMENT MODE" value={mode} />
          {payment.transaction_reference && (
            <DetailRow label="TRANSACTION REF" value={payment.transaction_reference} />
          )}
          {payment.initiated_at && (
            <DetailRow label="INITIATED" value={formatDateTime(payment.initiated_at)} />
          )}
          {payment.payment_status === 'success' && payment.initiated_at && (
            <DetailRow label="PROCESSED" value={formatDateTime(payment.initiated_at)} />
          )}
          {(payment as any).collection_ticket_id && (
            <TouchableOpacity
              style={[styles.detailRow, styles.detailRowLast]}
              onPress={() => router.push({
                pathname: '/(reeler)/collection-detail',
                params: { ticketId: (payment as any).collection_ticket_id },
              })}
            >
              <Text style={styles.detailLabel}>LINKED TICKET</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.detailValue, { color: C.textPrimary }]}>View Ticket</Text>
                <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          {!((payment as any).collection_ticket_id) && (
            <DetailRow label="STATUS" value={ss.label} last />
          )}
        </View>

        {/* Failure reason */}
        {payment.payment_status === 'failed' && (
          <View style={styles.failBlock}>
            <Ionicons name="alert-circle" size={18} color={C.redText} />
            <Text style={styles.failText}>
              Payment failed. {(payment as any).failure_reason ?? 'Please contact support or retry.'}
            </Text>
          </View>
        )}

        {/* Retry / Download */}
        {payment.payment_status === 'failed' && (
          <TouchableOpacity style={styles.retryPayBtn} activeOpacity={0.85}>
            <Text style={styles.retryPayBtnText}>Retry Payment</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => alert('PDF receipt download coming soon.')}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={18} color={C.white} />
          <Text style={styles.downloadBtnText}>Download Receipt</Text>
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
  backBtn: { marginRight: S.sm },
  headerTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S['2xl'] },
  errorText: { fontSize: T.lg, color: C.textSecondary, marginTop: S.md, textAlign: 'center' },
  retryBtn: {
    marginTop: S.lg, paddingHorizontal: S.xl, paddingVertical: 10,
    borderRadius: R.md, backgroundColor: C.black,
  },
  retryBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.white },

  scrollContent: { padding: S.base, paddingBottom: S['3xl'] },

  amountBlock: { alignItems: 'center', paddingVertical: S['2xl'] },
  amountText: { fontSize: T['6xl'], fontWeight: T.extrabold, color: C.textPrimary, marginBottom: S.md },
  statusBadge: { borderRadius: R.full, paddingHorizontal: S.base, paddingVertical: 6 },
  statusBadgeText: { fontSize: T.base, fontWeight: T.bold, letterSpacing: 0.5 },

  detailBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.lg,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  detailValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  failBlock: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.sm,
    backgroundColor: C.redBg, borderRadius: R.lg, padding: S.md,
    marginBottom: S.md,
  },
  failText: { flex: 1, fontSize: T.base, color: C.redText, lineHeight: 20 },

  retryPayBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: S.sm,
  },
  retryPayBtnText: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },

  downloadBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: S.sm,
  },
  downloadBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
