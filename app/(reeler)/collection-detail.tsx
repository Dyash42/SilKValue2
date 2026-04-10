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

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const GREEN = '#22C55E';
const RED = '#EF4444';
const AMBER = '#F59E0B';

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function InfoRowLast({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.infoRow, styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PaymentStatusBadge({ status }: { status: string | null }) {
  let bg = SURFACE_ALT;
  let color = TEXT_SECONDARY;
  const label = (status ?? 'unknown').toUpperCase();

  if (status === 'completed') { bg = '#DCFCE7'; color = '#15803D'; }
  else if (status === 'pending') { bg = '#FEF3C7'; color = '#B45309'; }
  else if (status === 'failed') { bg = '#FEE2E2'; color = '#B91C1C'; }
  else if (status === 'processing') { bg = '#DBEAFE'; color = '#1D4ED8'; }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Grade label helper
// ---------------------------------------------------------------------------

function gradeLabel(grade: string): string {
  switch (grade) {
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
  const [reelerName, setReelerName] = useState<string>('—');
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
        // Fetch ticket with payments
        const { data: ticketData, error: ticketErr } = await supabase
          .from('collection_tickets')
          .select('*, payments(*)')
          .eq('id', ticketId as string)
          .single();

        if (ticketErr) throw new Error(ticketErr.message);
        if (!ticketData) throw new Error('Ticket not found.');

        if (cancelled) return;
        setTicket(ticketData as unknown as TicketWithPayments);

        // Fetch reeler profile
        if (ticketData.reeler_id) {
          const { data: reelerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', ticketData.reeler_id)
            .single();
          if (!cancelled && reelerData?.full_name) setReelerName(reelerData.full_name);
        }

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
            <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection Detail</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BLACK} />
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
            <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection Detail</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_MUTED} />
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
  const pricePerKg = ticket.price_per_kg ?? 0;
  const moisturePct = ticket.moisture_percent ?? 0;
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
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Detail</Text>
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
          <InfoRowLast label="COLLECTOR" value={collectorName} />
        </View>

        {/* ── WEIGHT DETAILS ── */}
        <SectionLabel>WEIGHT DETAILS</SectionLabel>
        <View style={styles.weightRow}>
          <View style={[styles.weightCard, { marginRight: 8 }]}>
            <Text style={styles.weightCardLabel}>Field Weight</Text>
            <Text style={styles.weightCardValue}>{grossWeight.toFixed(2)} kg</Text>
          </View>
          <View style={[styles.weightCard, { marginLeft: 8 }]}>
            <Text style={styles.weightCardLabel}>Factory Weight</Text>
            <Text style={styles.weightCardValue}>{netWeight.toFixed(2)} kg</Text>
          </View>
        </View>
        <View style={styles.varianceRow}>
          <Text style={styles.varianceLabel}>VARIANCE</Text>
          <Text style={styles.varianceValue}>
            {grossWeight > 0
              ? `${(((netWeight - grossWeight) / grossWeight) * 100).toFixed(1)}%`
              : '—'}
          </Text>
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
          <View style={[styles.infoRow, styles.deductionRow]}>
            <Text style={styles.infoLabel}>QUALITY DEDUCTIONS</Text>
            <Text style={[styles.infoValue, { color: RED }]}>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },

  // Centered (loading / error)
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: TEXT_SECONDARY, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BLACK,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },

  // Info block
  infoBlock: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },

  // Weight cards
  weightRow: { flexDirection: 'row', marginBottom: 8 },
  weightCard: {
    flex: 1,
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  weightCardLabel: { fontSize: 11, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 6 },
  weightCardValue: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY },

  // Variance
  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  varianceLabel: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED, letterSpacing: 0.5 },
  varianceValue: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },

  // Grade card
  gradeCard: {
    backgroundColor: BLACK,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  gradeBox: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  gradeBoxText: { fontSize: 20, fontWeight: '800', color: BLACK },
  gradeInfo: { flex: 1 },
  gradeTitle: { fontSize: 16, fontWeight: '700', color: WHITE, marginBottom: 4 },
  gradeSub: { fontSize: 12, color: '#CCCCCC' },

  // Payment breakdown extras
  deductionRow: { backgroundColor: WHITE },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 0 },
  netLabel: { color: TEXT_PRIMARY, fontSize: 12, fontWeight: '700' },
  netValue: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY },

  // Payment status card
  paymentStatusCard: {
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  paymentStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
  },

  // Badge
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // UTR row
  utrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  utrLabel: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED, letterSpacing: 0.5 },
  utrValue: { fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY },
});
