import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import Input from '@/components/shared/Input';
import GradeSelector from '@/components/collector/GradeSelector';
import type { Grade } from '@/components/collector/GradeSelector';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';

// ---- Form state ----
interface FormValues {
  grossWeight: string;
  tareWeight: string;
  grade: Grade | null;
  moisture: string;
  crateCount: string;
  reelerId: string;
}

// ---- Ticket display ----
interface TicketData {
  ticketId: string;
  dateTime: string;
  reelerName: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  grade: string;
  pricePerKg: number;
  totalAmount: number;
}

// ---- Dashed separator ----
function DashedSeparator() {
  return <View style={styles.dashedSep} />;
}

// ---- Info row ----
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ---- Ticket View ----
function TicketView({ ticket, onNext }: { ticket: TicketData; onNext: () => void }) {
  const fmt = (n: number) =>
    '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Silk Value Collection Ticket\nTicket: ${ticket.ticketId}\nDate: ${ticket.dateTime}\nReeler: ${ticket.reelerName}\nNet Weight: ${ticket.netKg} kg\nGrade: ${ticket.grade}\nAmount: ${fmt(ticket.totalAmount)}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketHeaderTitle}>Collection Ticket</Text>
        </View>

        {/* Ticket card */}
        <View style={styles.ticketCard}>
          <Text style={styles.ticketBrand}>SILK VALUE</Text>
          <Text style={styles.ticketId}>TICKET ID: #{ticket.ticketId}</Text>

          <View style={styles.ticketDivider} />

          <InfoRow label="DATE / TIME" value={ticket.dateTime} />
          <InfoRow label="REELER" value={ticket.reelerName} />

          <View style={styles.ticketDivider} />

          {/* Weight grid */}
          <View style={styles.weightGrid}>
            {[
              { label: 'GROSS', value: `${ticket.grossKg} kg` },
              { label: 'TARE', value: `${ticket.tareKg} kg` },
              { label: 'NET', value: `${ticket.netKg} kg` },
            ].map((col, i) => (
              <View key={col.label} style={[styles.weightCell, i < 2 ? styles.weightCellBorder : null]}>
                <Text style={styles.weightCellLabel}>{col.label}</Text>
                <Text style={styles.weightCellValue}>{col.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ticketDivider} />

          {/* Grade pill */}
          <View style={styles.gradePillRow}>
            <View style={styles.gradePill}>
              <Text style={styles.gradePillText}>GRADE {ticket.grade}+</Text>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          {/* Payable amount */}
          <Text style={styles.payableLabel}>PAYABLE AMOUNT</Text>
          <Text style={styles.payableAmount}>{fmt(ticket.totalAmount)}</Text>

          <DashedSeparator />

          <Text style={styles.verifiedText}>DIGITAL RECEIPT VERIFIED</Text>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={styles.shareWhatsApp} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareWhatsAppText}>Share via WhatsApp</Text>
        </TouchableOpacity>

        <View style={styles.secondaryBtnsRow}>
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Print</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>NEXT REELER</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Form View ----
function FormView({ onSubmit }: { onSubmit: (data: TicketData) => void }) {
  const { profile } = useAuth();
  const { createTicket, isCreating } = useCollectionTicket();

  const [form, setForm] = useState<FormValues>({
    grossWeight: '',
    tareWeight: '',
    grade: null,
    moisture: '',
    crateCount: '1',
    reelerId: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const set = (k: keyof FormValues) => (v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.reelerId.trim()) e.reelerId = 'Required';
    if (!form.grossWeight || isNaN(+form.grossWeight)) e.grossWeight = 'Enter valid weight';
    if (!form.tareWeight || isNaN(+form.tareWeight)) e.tareWeight = 'Enter valid weight';
    if (!form.grade) e.grade = 'Select grade';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const gross = +form.grossWeight;
    const tare = +form.tareWeight;
    const net = gross - tare;
    const pricePerKg = 480; // placeholder
    const totalAmount = net * pricePerKg;

    try {
      await createTicket({
        reelerId: form.reelerId.trim(),
        collectorId: profile?.user_id ?? 'unknown',
        routeId: null,
        routeStopId: null,
        grossWeightKg: gross,
        tareWeightKg: tare,
        qualityGrade: form.grade ?? 'A',
        moisturePercent: form.moisture ? +form.moisture : null,
        crateCount: +form.crateCount,
        pricePerKg,
        pricingSnapshot: {
          grade: (form.grade as 'A' | 'B' | 'C' | 'Reject') ?? 'A',
          pricePerKg,
          moistureDeduction: 0,
          effectiveFrom: new Date().toISOString(),
        },
        photos: [],
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracyMeters: null,
        deviceId: null,
        networkStatus: 'online',
      });

      onSubmit({
        ticketId: `SKV-${Date.now()}`,
        dateTime: new Date().toLocaleString('en-IN'),
        reelerName: form.reelerId.trim(),
        grossKg: gross,
        tareKg: tare,
        netKg: net,
        grade: form.grade ?? 'A',
        pricePerKg,
        totalAmount,
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.formHeaderTitle}>New Collection</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContent}>
        <Input
          label="Reeler ID / Name"
          value={form.reelerId}
          onChangeText={set('reelerId')}
          placeholder="Enter reeler ID"
          error={errors.reelerId}
        />
        <Input
          label="Gross Weight (kg)"
          value={form.grossWeight}
          onChangeText={set('grossWeight')}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.grossWeight}
        />
        <Input
          label="Tare Weight (kg)"
          value={form.tareWeight}
          onChangeText={set('tareWeight')}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.tareWeight}
        />
        <Input
          label="Moisture %"
          value={form.moisture}
          onChangeText={set('moisture')}
          placeholder="e.g. 12"
          keyboardType="decimal-pad"
        />
        <Input
          label="Crate Count"
          value={form.crateCount}
          onChangeText={set('crateCount')}
          placeholder="1"
          keyboardType="number-pad"
        />

        <Text style={styles.gradeLabel}>QUALITY GRADE</Text>
        <GradeSelector selected={form.grade} onSelect={(g) => { setForm((p) => ({ ...p, grade: g })); }} />
        {errors.grade ? <Text style={styles.errorText}>{errors.grade}</Text> : null}

        {/* Net weight preview */}
        {form.grossWeight && form.tareWeight && (
          <View style={styles.netPreview}>
            <Text style={styles.netPreviewLabel}>NET WEIGHT</Text>
            <Text style={styles.netPreviewValue}>
              {(+form.grossWeight - +form.tareWeight).toFixed(2)} kg
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitFormBtn, isCreating ? styles.submitBtnDisabled : null]}
          onPress={handleSubmit}
          disabled={isCreating}
          activeOpacity={0.85}
        >
          <Text style={styles.submitFormBtnText}>
            {isCreating ? 'Creating Ticket…' : 'Create Ticket'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Main ----
type ScreenState = 'form' | 'ticket';

export default function NewTicketScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  if (screenState === 'ticket' && ticketData) {
    return (
      <TicketView
        ticket={ticketData}
        onNext={() => {
          setTicketData(null);
          setScreenState('form');
        }}
      />
    );
  }

  return (
    <FormView
      onSubmit={(data) => {
        setTicketData(data);
        setScreenState('ticket');
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },
  formContent: { padding: 16, paddingBottom: 40 },

  // Form header
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { marginRight: 8 },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Grade
  gradeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  // Net preview
  netPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  netPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },
  netPreviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Submit button (form)
  submitFormBtn: {
    backgroundColor: BLACK,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitFormBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  // Ticket view
  ticketHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  ticketHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  ticketCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  ticketBrand: {
    fontSize: 16,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Weight grid
  weightGrid: {
    flexDirection: 'row',
  },
  weightCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weightCellBorder: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  weightCellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  weightCellValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Grade pill
  gradePillRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  gradePill: {
    borderWidth: 1,
    borderColor: BLACK,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 0.5,
  },

  // Payable amount
  payableLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  payableAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },

  // Dashed separator
  dashedSep: {
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BORDER,
    marginVertical: 12,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Action buttons
  shareWhatsApp: {
    backgroundColor: BLACK,
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareWhatsAppText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryBtnsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BLACK,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '600',
  },

  nextBtn: {
    backgroundColor: BLACK,
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
