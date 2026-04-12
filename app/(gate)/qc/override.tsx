import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const REASONS = [
  { key: 'scale_error', label: 'Scale error', desc: 'Weighing equipment gave incorrect reading' },
  { key: 'manual_adjustment', label: 'Manual adjustment', desc: 'Physical quantity differs from recorded' },
  { key: 'supervisor_directive', label: 'Supervisor directive', desc: 'Verbal instruction from supervisor' },
  { key: 'other', label: 'Other', desc: 'Explain below' },
] as const;

type ReasonKey = typeof REASONS[number]['key'];

export default function OverrideRequestScreen() {
  const { entryId, variancePct, tolerancePct } = useLocalSearchParams<{
    entryId: string; variancePct: string; tolerancePct: string;
  }>();
  const [selected, setSelected] = useState<ReasonKey | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!selected) { Alert.alert('Required', 'Please select a reason.'); return; }
    if (selected === 'other' && !notes.trim()) { Alert.alert('Required', 'Please explain the override reason.'); return; }

    // Mock: save override_status = 'pending_review'
    Alert.alert(
      'Override Submitted',
      'Override request submitted. Supervisor has been notified.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Request Override</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Context card */}
        <View style={styles.contextCard}>
          <Row label="Entry" value={`#${(entryId ?? '').slice(0, 8).toUpperCase()}`} />
          <Row label="Variance" value={`${parseFloat(variancePct ?? '0').toFixed(1)}%`} />
          <Row label="Tolerance" value={`${tolerancePct ?? '2.5'}%`} noBorder />
        </View>

        {/* Reason selection */}
        <Text style={styles.sectionLabel}>REASON FOR OVERRIDE (REQUIRED)</Text>
        <View style={styles.reasonBlock}>
          {REASONS.map(r => {
            const active = selected === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[styles.reasonRow, active && styles.reasonRowActive]}
                onPress={() => setSelected(r.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reasonLabel}>{r.label}</Text>
                  <Text style={styles.reasonDesc}>{r.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder={selected === 'other' ? 'Describe the reason…' : 'Additional notes (optional)'}
          placeholderTextColor={C.textMuted}
          multiline
        />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>Submit Override Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, noBorder }: { label: string; value: string; noBorder?: boolean }) {
  return (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  contextCard: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.xl,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { fontSize: T.base, color: C.textSecondary },
  infoValue: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.sm,
  },
  reasonBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.lg,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 14, paddingHorizontal: S.base,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  reasonRowActive: { backgroundColor: C.surfaceAlt },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.black },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.black },
  reasonLabel: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  reasonDesc: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },

  notesInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, fontSize: T.md, color: C.textPrimary,
    minHeight: 80, textAlignVertical: 'top', marginBottom: S.xl,
  },

  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
