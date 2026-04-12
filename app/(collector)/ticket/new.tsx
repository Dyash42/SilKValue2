import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import Input from '@/components/shared/Input';
import GradeSelector from '@/components/collector/GradeSelector';
import WeightEntryPanel from '@/components/collector/WeightEntryPanel';
import type { Grade } from '@/components/collector/GradeSelector';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function NewTicketScreen() {
  const { stopId, routeId } = useLocalSearchParams<{ stopId: string; routeId: string }>();
  const { profile } = useAuth();
  const { createTicket, isCreating } = useCollectionTicket();

  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [moisture, setMoisture] = useState('');
  const [crateCount, setCrateCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const gross = parseFloat(grossWeight) || 0;
  const tare = parseFloat(tareWeight) || 0;
  const net = Math.max(0, gross - tare);
  const pricePerKg = 480; // placeholder — from price_lists
  const totalAmount = net * pricePerKg;

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!grossWeight || gross <= 0) e.grossWeight = 'Enter valid weight';
    if (!tareWeight || isNaN(tare)) e.tareWeight = 'Enter valid weight';
    if (!grade) e.grade = 'Select grade';
    if (!crateCount || parseInt(crateCount) <= 0) e.crateCount = 'Enter valid count';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      const ticketId = `TKT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      await createTicket({
        reelerId: 'reeler-placeholder',
        collectorId: profile?.user_id ?? 'unknown',
        routeId: routeId ?? null,
        routeStopId: stopId ?? null,
        grossWeightKg: gross,
        tareWeightKg: tare,
        qualityGrade: grade ?? 'A',
        moisturePercent: moisture ? +moisture : null,
        crateCount: +crateCount,
        pricePerKg,
        pricingSnapshot: {
          grade: (grade as 'A' | 'B' | 'C' | 'Reject') ?? 'A',
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

      // Navigate to confirmation
      router.push({
        pathname: '/(collector)/ticket/confirm',
        params: {
          ticketId,
          grossKg: gross.toString(),
          tareKg: tare.toString(),
          netKg: net.toString(),
          grade: grade ?? 'A',
          pricePerKg: pricePerKg.toString(),
          totalAmount: totalAmount.toString(),
          routeId: routeId ?? '',
          stopId: stopId ?? '',
        },
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create ticket.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>New Collection</Text>
          <Text style={styles.subtitle}>Reeler</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Weight entry */}
        <WeightEntryPanel
          grossWeight={grossWeight}
          tareWeight={tareWeight}
          onGrossChange={(v) => { setGrossWeight(v); setErrors((e) => ({ ...e, grossWeight: '' })); }}
          onTareChange={(v) => { setTareWeight(v); setErrors((e) => ({ ...e, tareWeight: '' })); }}
          grossError={errors.grossWeight}
          tareError={errors.tareWeight}
        />

        {/* Grade */}
        <Text style={styles.sectionLabel}>QUALITY GRADE</Text>
        <GradeSelector selected={grade} onSelect={(g) => { setGrade(g); setErrors((e) => ({ ...e, grade: '' })); }} />
        {errors.grade ? <Text style={styles.errorText}>{errors.grade}</Text> : null}

        {/* Additional fields */}
        <View style={styles.addlFields}>
          <Input label="Moisture %" value={moisture} onChangeText={setMoisture} placeholder="e.g. 12" keyboardType="decimal-pad" />
          <Input label="Crate Count" value={crateCount} onChangeText={setCrateCount} placeholder="1" keyboardType="number-pad" error={errors.crateCount} />
          <Input label="Visual Notes" value={notes} onChangeText={setNotes} placeholder="Any quality observations…" multiline />
        </View>

        {/* Photo placeholder */}
        <Text style={styles.sectionLabel}>PHOTO EVIDENCE (OPTIONAL)</Text>
        <TouchableOpacity style={styles.photoBtn} activeOpacity={0.8}>
          <Ionicons name="camera-outline" size={20} color={C.textPrimary} />
          <Text style={styles.photoBtnText}>Take Photo</Text>
        </TouchableOpacity>

        {/* Price display */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceRow}>Price per kg: {fmt(pricePerKg)} (Grade {grade ?? '—'})</Text>
          <Text style={styles.priceTotal}>Total Amount: {fmt(totalAmount)}</Text>
        </View>

        {/* GPS */}
        <Text style={styles.gpsText}>Location: not captured</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isCreating && { opacity: 0.4 }]}
          onPress={handleSubmit}
          disabled={isCreating}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>{isCreating ? 'Creating…' : 'Generate Ticket'}</Text>
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
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  subtitle: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginTop: S.xl, marginBottom: S.sm,
  },
  errorText: { fontSize: T.xs, color: C.red, marginTop: 4 },
  addlFields: { marginTop: S.lg },

  photoBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm,
  },
  photoBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  priceBlock: {
    backgroundColor: C.surfaceAlt, borderRadius: R.lg,
    padding: S.md, marginTop: S.xl,
  },
  priceRow: { fontSize: T.base, color: C.textSecondary, marginBottom: 4 },
  priceTotal: { fontSize: T.xl, fontWeight: T.bold, color: C.textPrimary },

  gpsText: { fontSize: T.xs, color: C.textMuted, marginTop: S.md, fontFamily: 'monospace' },

  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginTop: S.xl,
  },
  submitText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
