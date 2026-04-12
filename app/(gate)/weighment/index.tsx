import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { createGateEntry } from '@/services/gate.service';
import Input from '@/components/shared/Input';
import Badge from '@/components/shared/Badge';
import ScalePairingSheet from '@/components/gate/ScalePairingSheet';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function WeighmentEntry() {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    vehiclePlate: '',
    expectedWeight: '',
    grossWeight: '',
    tareWeight: '',
    scaleId: '',
    calibrationDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleLookup, setVehicleLookup] = useState<'none' | 'found' | 'not_found'>('none');
  const [showScaleSheet, setShowScaleSheet] = useState(false);
  const [pairedScale, setPairedScale] = useState<{ id: string; name: string } | null>(null);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const gross = parseFloat(form.grossWeight) || 0;
  const tare = parseFloat(form.tareWeight) || 0;
  const netWeight = Math.max(0, gross - tare);
  const expectedNet = parseFloat(form.expectedWeight) || 0;

  const variance = useMemo(() => {
    if (!expectedNet || !netWeight) return null;
    const pct = ((netWeight - expectedNet) / expectedNet) * 100;
    return { pct, kg: netWeight - expectedNet };
  }, [expectedNet, netWeight]);

  const tolerancePct = 2.5; // from cluster, placeholder
  const isOutOfTolerance = variance != null && Math.abs(variance.pct) > tolerancePct;

  const handleLookup = () => {
    if (!form.vehiclePlate.trim()) { Alert.alert('Required', 'Enter a vehicle plate number.'); return; }
    // Mock lookup
    const found = form.vehiclePlate.toUpperCase().includes('KA');
    setVehicleLookup(found ? 'found' : 'not_found');
    if (found) {
      setForm(p => ({ ...p, expectedWeight: '125.5' }));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehiclePlate.trim()) e.vehiclePlate = 'Required';
    if (!form.grossWeight || gross <= 0) e.grossWeight = 'Enter valid weight';
    if (!form.tareWeight || isNaN(tare)) e.tareWeight = 'Enter valid weight';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (isOutOfTolerance) {
      Alert.alert(
        'Variance Warning',
        `Variance of ${variance?.pct.toFixed(1)}% exceeds ${tolerancePct}% tolerance. Will require QC review. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: doSubmit },
        ],
      );
    } else {
      await doSubmit();
    }
  };

  const doSubmit = async () => {
    setIsSubmitting(true);
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const result = await createGateEntry({
        vehicleId: form.vehiclePlate.trim().toUpperCase(),
        collectorId: 'unknown',
        routeId: 'unknown',
        batchId: null,
        expectedGrossWeightKg: expectedNet,
        expectedNetWeightKg: expectedNet,
        gateGrossWeightKg: gross,
        varianceTolerancePct: tolerancePct,
        notes: form.notes || null,
        gateOperatorId: profile?.user_id ?? 'unknown',
        scaleId: pairedScale?.id ?? (form.scaleId || 'scale-01'),
        scaleCalibrationDate: form.calibrationDate || new Date().toISOString().split('T')[0],
        weighedBy: profile?.full_name ?? 'Operator',
        vehicleTareWeightKg: tare,
        finalAcceptedWeightKg: netWeight,
      });
      // Navigate to QC with the new entry ID
      router.push(`/(gate)/qc/${result?.id ?? 'new'}`);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>New Check-In</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Vehicle Identification */}
        <Text style={styles.sectionLabel}>VEHICLE IDENTIFICATION</Text>
        <Input
          label="Vehicle Plate" value={form.vehiclePlate}
          onChangeText={set('vehiclePlate')} placeholder="e.g. KA-01-AB-1234"
          autoCapitalize="characters" error={errors.vehiclePlate}
        />
        <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup} activeOpacity={0.85}>
          <Text style={styles.lookupBtnText}>Look Up Vehicle</Text>
        </TouchableOpacity>
        {vehicleLookup === 'found' && (
          <View style={styles.lookupResult}>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
            <Text style={styles.lookupResultText}>Vehicle found — Route: Cluster A, Expected: {form.expectedWeight} kg</Text>
          </View>
        )}
        {vehicleLookup === 'not_found' && (
          <View style={[styles.lookupResult, { backgroundColor: C.amberBg }]}>
            <Ionicons name="warning" size={16} color={C.amber} />
            <Text style={[styles.lookupResultText, { color: C.amber }]}>Vehicle not in system — manual entry mode</Text>
          </View>
        )}

        {/* Weighment Inputs */}
        <Text style={styles.sectionLabel}>WEIGHMENT</Text>
        <Input
          label="Gate Gross Weight (kg)" value={form.grossWeight}
          onChangeText={set('grossWeight')} placeholder="0.00"
          keyboardType="decimal-pad" error={errors.grossWeight}
        />
        <Input
          label="Vehicle Tare Weight (kg)" value={form.tareWeight}
          onChangeText={set('tareWeight')} placeholder="0.00"
          keyboardType="decimal-pad" error={errors.tareWeight}
        />

        {/* Net weight display */}
        <View style={styles.netRow}>
          <Text style={styles.netLabel}>GATE NET WEIGHT</Text>
          <Text style={styles.netValue}>{netWeight.toFixed(2)} kg</Text>
        </View>

        {/* Scale connect */}
        <TouchableOpacity style={styles.scaleConnectRow} onPress={() => setShowScaleSheet(true)} activeOpacity={0.85}>
          <View style={[styles.scaleDot, { backgroundColor: pairedScale ? C.green : C.textMuted }]} />
          <Text style={styles.scaleText}>{pairedScale ? pairedScale.name : 'Connect Scale'}</Text>
          <Ionicons name="bluetooth-outline" size={16} color={C.textPrimary} />
        </TouchableOpacity>

        {/* Variance display */}
        {variance != null && (
          <View style={[styles.varianceCard, isOutOfTolerance && { backgroundColor: C.redBg }]}>
            <View style={styles.varianceHeader}>
              <Text style={styles.varianceLabel}>VARIANCE</Text>
              <Badge
                label={isOutOfTolerance ? 'OUTSIDE TOLERANCE' : 'WITHIN TOLERANCE'}
                variant={isOutOfTolerance ? 'error' : 'success'}
              />
            </View>
            <Text style={[styles.varianceValue, isOutOfTolerance && { color: C.red }]}>
              {variance.pct > 0 ? '+' : ''}{variance.pct.toFixed(1)}% ({variance.kg > 0 ? '+' : ''}{variance.kg.toFixed(1)} kg)
            </Text>
            <Text style={styles.varianceSub}>Field: {expectedNet.toFixed(1)} kg · Gate: {netWeight.toFixed(1)} kg</Text>
            {isOutOfTolerance && (
              <Text style={styles.varianceWarning}>Will require QC review</Text>
            )}
          </View>
        )}

        {/* Scale Info */}
        <Text style={styles.sectionLabel}>SCALE INFO</Text>
        <Input label="Scale ID" value={form.scaleId} onChangeText={set('scaleId')} placeholder="e.g. SCALE-01" />
        <Input label="Calibration Date" value={form.calibrationDate} onChangeText={set('calibrationDate')} placeholder="YYYY-MM-DD" />

        {/* Notes */}
        <Input label="Notes (optional)" value={form.notes} onChangeText={set('notes')} placeholder="Inspection notes…" multiline />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.4 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting…' : 'Record & Proceed to QC'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Scale pairing modal */}
      <Modal visible={showScaleSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScalePairingSheet
            pairedScaleId={pairedScale?.id}
            pairedScaleName={pairedScale?.name}
            onPair={(id, name) => { setPairedScale({ id, name }); setShowScaleSheet(false); }}
            onForget={() => { setPairedScale(null); }}
            onClose={() => setShowScaleSheet(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.base, paddingVertical: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginTop: S.xl, marginBottom: S.sm,
  },
  lookupBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingVertical: 10, alignItems: 'center', marginBottom: S.sm,
  },
  lookupBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  lookupResult: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.greenBg, borderRadius: R.md, padding: S.md, marginBottom: S.sm,
  },
  lookupResultText: { flex: 1, fontSize: T.base, color: C.greenText },

  netRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: S.md, marginBottom: S.md,
  },
  netLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.5 },
  netValue: { fontSize: T['2xl'], fontWeight: T.extrabold, color: C.textPrimary },

  scaleConnectRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, marginBottom: S.md,
  },
  scaleDot: { width: 6, height: 6, borderRadius: 3 },
  scaleText: { flex: 1, fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  varianceCard: {
    backgroundColor: C.surfaceAlt, borderRadius: R.lg, padding: S.md, marginBottom: S.lg,
  },
  varianceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  varianceLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 1 },
  varianceValue: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 4 },
  varianceSub: { fontSize: T.base, color: C.textSecondary },
  varianceWarning: { fontSize: T.base, color: C.red, fontWeight: T.semibold, marginTop: S.xs },

  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginTop: S.xl,
  },
  submitBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
});
