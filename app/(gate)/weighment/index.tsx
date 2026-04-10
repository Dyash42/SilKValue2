import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { createGateEntry } from '@/services/gate.service';
import Input from '@/components/shared/Input';

// Design system colors
const BG = '#FFFFFF';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const SURFACE_ALT = '#F5F5F5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const RED = '#EF4444';

export default function NewGateEntry() {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    vehiclePlate: '',
    expectedWeight: '',
    actualWeight: '',
    tare: '',
    tolerance: '5',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const variance = useMemo(() => {
    const exp = parseFloat(form.expectedWeight);
    const act = parseFloat(form.actualWeight);
    if (!exp || !act) return null;
    const pct = ((act - exp) / exp) * 100;
    return { pct, kg: act - exp };
  }, [form.expectedWeight, form.actualWeight]);

  const tolerancePct = parseFloat(form.tolerance) || 5;
  const isOutOfTolerance = variance != null && Math.abs(variance.pct) > tolerancePct;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehiclePlate.trim()) e.vehiclePlate = 'Required';
    if (!form.expectedWeight || isNaN(+form.expectedWeight)) e.expectedWeight = 'Enter valid weight';
    if (!form.actualWeight || isNaN(+form.actualWeight)) e.actualWeight = 'Enter valid weight';
    if (!form.tare || isNaN(+form.tare)) e.tare = 'Enter valid tare';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (isOutOfTolerance) {
      Alert.alert(
        'Variance Warning',
        `Variance of ${variance?.pct.toFixed(1)}% exceeds ${tolerancePct}% tolerance. Continue?`,
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
      const gross = +form.actualWeight;
      const tare = +form.tare;
      await createGateEntry({
        vehicleId: form.vehiclePlate.trim(),
        collectorId: profile?.user_id ?? 'unknown',
        routeId: 'unknown',
        batchId: null,
        expectedGrossWeightKg: +form.expectedWeight,
        expectedNetWeightKg: +form.expectedWeight - tare,
        gateGrossWeightKg: gross,
        varianceTolerancePct: tolerancePct,
        notes: form.notes || null,
        gateOperatorId: profile?.user_id ?? 'unknown',
        scaleId: 'scale-01',
        scaleCalibrationDate: new Date().toISOString().split('T')[0],
        weighedBy: profile?.full_name ?? 'Operator',
        vehicleTareWeightKg: tare,
        finalAcceptedWeightKg: gross - tare,
      });
      Alert.alert('Success', 'Gate entry created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>New Gate Entry</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input
          label="Vehicle Plate"
          value={form.vehiclePlate}
          onChangeText={set('vehiclePlate')}
          placeholder="e.g. KA-01-AB-1234"
          error={errors.vehiclePlate}
        />
        <Input
          label="Expected Weight (kg)"
          value={form.expectedWeight}
          onChangeText={set('expectedWeight')}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.expectedWeight}
        />
        <Input
          label="Actual Gross Weight (kg)"
          value={form.actualWeight}
          onChangeText={set('actualWeight')}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.actualWeight}
        />
        <Input
          label="Tare Weight (kg)"
          value={form.tare}
          onChangeText={set('tare')}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.tare}
        />
        <Input
          label="Tolerance %"
          value={form.tolerance}
          onChangeText={set('tolerance')}
          placeholder="5"
          keyboardType="decimal-pad"
        />
        <Input
          label="Notes"
          value={form.notes}
          onChangeText={set('notes')}
          placeholder="Optional inspection notes"
          multiline
        />

        {/* Live variance */}
        {variance != null && (
          <View style={[styles.varianceCard, isOutOfTolerance ? styles.varianceCardRed : null]}>
            <Text style={styles.varianceCardLabel}>LIVE VARIANCE</Text>
            <Text style={[styles.varianceCardValue, isOutOfTolerance ? styles.varianceRed : null]}>
              {variance.pct > 0 ? '+' : ''}{variance.pct.toFixed(2)}%
              {' '}({variance.kg > 0 ? '+' : ''}{variance.kg.toFixed(1)} kg)
            </Text>
            {isOutOfTolerance && (
              <Text style={styles.varianceWarning}>Exceeds {tolerancePct}% tolerance</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting ? styles.submitBtnDisabled : null]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Submitting…' : 'Submit Entry'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
  content: { padding: 16, paddingBottom: 40 },
  varianceCard: {
    backgroundColor: SURFACE_ALT,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  varianceCardRed: {
    backgroundColor: '#FEE2E2',
  },
  varianceCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  varianceCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  varianceRed: {
    color: RED,
  },
  varianceWarning: {
    fontSize: 12,
    color: RED,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: BLACK,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
});
