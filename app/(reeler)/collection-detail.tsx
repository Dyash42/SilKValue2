import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import type { CollectionTicketRow, PaymentRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketWithPayments = CollectionTicketRow & {
  payments: PaymentRow[];
};

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PaymentStatusBadge({ status }: { status: string | null }) {
  let bg: string = C.surfaceAlt;
  let color: string = C.textSecondary;
  const label = (status ?? 'unknown').toUpperCase();

  if (status === 'completed') { bg = C.greenBg; color = C.greenText; }
  else if (status === 'pending') { bg = C.amberBg; color = C.amberText; }
  else if (status === 'failed') { bg = C.redBg; color = C.redText; }
  else if (status === 'processing') { bg = C.blueBg; color = C.blueText; }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function gradeLabel(grade: string): string {
  switch (grade) {
    case 'A+': return 'Premium+ Grade';
    case 'A': return 'Premium Grade';
    case 'B': return 'Standard Grade';
    case 'C': return 'Economy Grade';
    case 'rejected': return 'Rejected';
    default: return grade.toUpperCase();
  }
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CollectionDetailScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();

  const [ticket, setTicket] = useState<TicketWithPayments | null>(null);
  const [collectorName, setCollectorName] = useState<string>('—');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) {
      setError('No ticket ID provided.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const { data: ticketData, error: ticketErr } = await supabase
          .from('collection_tickets')
          .select('*, payments(*)')
          .eq('id', ticketId as string)
          .single();

        if (ticketErr) throw new Error(ticketErr.message);
        if (!ticketData) throw new Error('Ticket not found.');

        if (cancelled) return;
        setTicket(ticketData as unknown as TicketWithPayments);

        // Fetch collector profile
        if (ticketData.collector_id) {
          const { data: collectorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ticketData.collector_id)
            .single();
          if (!cancelled && collectorData?.full_name) setCollectorName(collectorData.full_name);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load ticket.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ticketId]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection Receipt</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.black} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error || !ticket) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection Receipt</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={styles.errorText}>{error ?? 'Ticket not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const grossWeight = ticket.gross_weight_kg ?? 0;
  const netWeight = ticket.net_weight_kg ?? 0;
  const tareWeight = grossWeight - netWeight;
  const pricePerKg = ticket.price_per_kg ?? 0;
  const moisturePct = ticket.moisture_percent ?? 0;
  const crateCount = (ticket as any).crate_count ?? null;
  const grossAmount = grossWeight * pricePerKg;
  const moistureDeduction = grossAmount * (moisturePct / 100);
  const netPayable = ticket.total_amount ?? 0;

  const payment = ticket.payments && ticket.payments.length > 0 ? ticket.payments[0] : null;
  const paymentStatus = payment?.payment_status ?? ticket.status ?? null;

  const grade = ticket.quality_grade ?? 'A';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Receipt</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── TICKET INFORMATION ── */}
        <SectionLabel>TICKET INFORMATION</SectionLabel>
        <View style={styles.infoBlock}>
          <InfoRow label="TICKET ID" value={ticket.ticket_number} />
          <InfoRow
            label="DATE / TIME"
            value={ticket.collection_timestamp ? formatDateTime(ticket.collection_timestamp) : '—'}
          />
          <InfoRow label="COLLECTOR" value={collectorName} last />
        </View>

        {/* ── WEIGHT DETAILS ── */}
        <SectionLabel>WEIGHT DETAILS</SectionLabel>
        <View style={styles.weightRow}>
          <View style={[styles.weightCard, { marginRight: 8 }]}>
            <Text style={styles.weightCardLabel}>Gross Weight</Text>
            <Text style={styles.weightCardValue}>{grossWeight.toFixed(2)} kg</Text>
          </View>
          <View style={[styles.weightCard, { marginLeft: 8 }]}>
            <Text style={styles.weightCardLabel}>Net Weight</Text>
            <Text style={styles.weightCardValue}>{netWeight.toFixed(2)} kg</Text>
          </View>
        </View>
        <View style={styles.infoBlock}>
          <InfoRow label="TARE WEIGHT" value={`${tareWeight.toFixed(2)} kg`} />
          {crateCount !== null && <InfoRow label="CRATE COUNT" value={String(crateCount)} />}
          <InfoRow
            label="VARIANCE"
            value={grossWeight > 0 ? `${(((netWeight - grossWeight) / grossWeight) * 100).toFixed(1)}%` : '—'}
            last
          />
        </View>

        {/* ── QUALITY GRADE ── */}
        <SectionLabel>QUALITY GRADE</SectionLabel>
        <View style={styles.gradeCard}>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeBoxText}>{grade.toUpperCase()}</Text>
          </View>
          <View style={styles.gradeInfo}>
            <Text style={styles.gradeTitle}>{gradeLabel(grade)}</Text>
            {moisturePct > 0 && (
              <Text style={styles.gradeSub}>Moisture Content: {moisturePct.toFixed(1)}%</Text>
            )}
          </View>
        </View>

        {/* ── PAYMENT BREAKDOWN ── */}
        <SectionLabel>PAYMENT BREAKDOWN</SectionLabel>
        <View style={styles.infoBlock}>
          <InfoRow label="BASE RATE" value={`${formatCurrency(pricePerKg)} / kg`} />
          <InfoRow label="GROSS AMOUNT" value={formatCurrency(grossAmount)} />
          <View style={[styles.infoRow]}>
            <Text style={styles.infoLabel}>QUALITY DEDUCTIONS</Text>
            <Text style={[styles.infoValue, { color: C.red }]}>
              {moisturePct > 0 ? `- ${formatCurrency(moistureDeduction)}` : '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={[styles.infoLabel, styles.netLabel]}>NET PAYABLE</Text>
            <Text style={[styles.infoValue, styles.netValue]}>{formatCurrency(netPayable)}</Text>
          </View>
        </View>

        {/* ── PAYMENT STATUS ── */}
        <View style={styles.paymentStatusCard}>
          <View style={styles.paymentStatusHeader}>
            <Text style={styles.paymentStatusLabel}>PAYMENT STATUS</Text>
            <PaymentStatusBadge status={paymentStatus as string | null} />
          </View>
          {payment?.transaction_reference ? (
            <View style={styles.utrRow}>
              <Text style={styles.utrLabel}>UTR / REF</Text>
              <Text style={styles.utrValue}>{payment.transaction_reference}</Text>
            </View>
          ) : null}
          {payment?.initiated_at ? (
            <View style={[styles.utrRow, { borderTopWidth: 0 }]}>
              <Text style={styles.utrLabel}>DATE</Text>
              <Text style={styles.utrValue}>{formatDate(payment.initiated_at)}</Text>
            </View>
          ) : null}
        </View>

        {/* Download receipt */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => alert('PDF receipt download coming soon.')}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={18} color={C.white} />
          <Text style={styles.downloadBtnText}>Download Receipt</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { marginRight: S.sm },
  headerTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S['2xl'] },
  errorText: { fontSize: T.lg, color: C.textSecondary, marginTop: S.md, textAlign: 'center' },
  retryBtn: {
    marginTop: S.lg,
    paddingHorizontal: S.xl,
    paddingVertical: 10,
    borderRadius: R.md,
    backgroundColor: C.black,
  },
  retryBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.white },

  scrollContent: { paddingHorizontal: S.base, paddingTop: S.base, paddingBottom: S['2xl'] },

  sectionLabel: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: S.sm,
  },

  infoBlock: {
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.base,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  weightRow: { flexDirection: 'row', marginBottom: S.sm },
  weightCard: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: R.md,
    padding: S.base,
    alignItems: 'center',
  },
  weightCardLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary, marginBottom: 6 },
  weightCardValue: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary },

  gradeCard: {
    backgroundColor: C.black,
    borderRadius: R.md,
    padding: S.base,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: S.lg,
  },
  gradeBox: {
    width: 48,
    height: 48,
    borderRadius: R.sm,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  gradeBoxText: { fontSize: T['3xl'], fontWeight: T.extrabold, color: C.black },
  gradeInfo: { flex: 1 },
  gradeTitle: { fontSize: T.xl, fontWeight: T.bold, color: C.white, marginBottom: 4 },
  gradeSub: { fontSize: T.base, color: C.borderStrong },

  divider: { height: 1, backgroundColor: C.border },
  netLabel: { color: C.textPrimary, fontSize: T.base, fontWeight: T.bold },
  netValue: { fontSize: T.xl, fontWeight: T.extrabold, color: C.textPrimary },

  paymentStatusCard: {
    backgroundColor: C.surfaceAlt,
    borderRadius: R.md,
    padding: S.base,
    marginBottom: S.lg,
  },
  paymentStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.md,
  },
  paymentStatusLabel: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.textSecondary,
    letterSpacing: 1,
  },

  badge: { borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 3 },
  badgeText: { fontSize: T.sm, fontWeight: T.bold, letterSpacing: 0.5 },

  utrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  utrLabel: { fontSize: T.sm, fontWeight: T.semibold, color: C.textMuted, letterSpacing: 0.5 },
  utrValue: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary },

  downloadBtn: {
    backgroundColor: C.black,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: S.sm,
  },
  downloadBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
