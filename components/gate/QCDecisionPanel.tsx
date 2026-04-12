import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export type QCDecision = 'accepted' | 'partial_rejection' | 'rejected';

interface QCDecisionPanelProps {
  onDecision: (decision: QCDecision, notes: string) => void;
  isLoading?: boolean;
}

const DECISIONS: { key: QCDecision; label: string }[] = [
  { key: 'accepted',          label: 'PASS' },
  { key: 'partial_rejection', label: 'HOLD' },
  { key: 'rejected',          label: 'FAIL' },
];

export default function QCDecisionPanel({ onDecision, isLoading = false }: QCDecisionPanelProps) {
  const [selected, setSelected] = useState<QCDecision | null>(null);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = () => {
    if (!selected) return;
    onDecision(selected, notes.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>QC DECISION</Text>

      {/* Decision buttons */}
      <View style={styles.buttonsRow}>
        {DECISIONS.map((d) => {
          const isActive = selected === d.key;
          const isFailOption = d.key === 'rejected';
          return (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.decisionBtn,
                isActive && d.key === 'accepted' ? styles.btnPassActive : null,
                isActive && d.key === 'partial_rejection' ? styles.btnHoldActive : null,
                isActive && d.key === 'rejected' ? styles.btnFailActive : null,
                !isActive && isFailOption ? styles.btnFailInactive : null,
              ]}
              onPress={() => setSelected(d.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.decisionBtnText,
                  isActive && d.key === 'accepted' ? styles.textPassActive : null,
                  isActive && d.key === 'partial_rejection' ? styles.textHoldActive : null,
                  isActive && d.key === 'rejected' ? styles.textFailActive : null,
                  !isActive && isFailOption ? styles.textFailInactive : null,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notes */}
      <Text style={styles.notesLabel}>
        {selected === 'partial_rejection' || selected === 'rejected'
          ? 'NOTES (REQUIRED)'
          : 'NOTES (OPTIONAL)'}
      </Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add inspection notes…"
        placeholderTextColor={C.textMuted}
        multiline
        numberOfLines={3}
        editable={!isLoading}
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (!selected || isLoading) ? styles.submitBtnDisabled : null]}
        onPress={handleSubmit}
        disabled={!selected || isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.submitBtnText}>
          {isLoading ? 'Submitting…' : 'Submit Decision'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: S.base, backgroundColor: C.white,
    borderRadius: R.md, borderWidth: 1, borderColor: C.border,
  },
  sectionLabel: {
    fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.md,
  },
  buttonsRow: { flexDirection: 'row', gap: 10, marginBottom: S.base },
  decisionBtn: {
    flex: 1, paddingVertical: 11, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt, alignItems: 'center',
  },
  btnPassActive: { backgroundColor: C.black, borderColor: C.black },
  btnHoldActive: { backgroundColor: C.surfaceAlt, borderColor: C.borderStrong },
  btnFailActive: { backgroundColor: C.white, borderColor: C.red },
  btnFailInactive: { borderColor: C.red, backgroundColor: C.white },
  decisionBtnText: { fontSize: T.base, fontWeight: T.bold, color: C.textPrimary, letterSpacing: 0.5 },
  textPassActive: { color: C.white },
  textHoldActive: { color: C.textPrimary },
  textFailActive: { color: C.red },
  textFailInactive: { color: C.red },
  notesLabel: {
    fontSize: T.sm, fontWeight: T.semibold, color: C.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
  },
  notesInput: {
    backgroundColor: C.surfaceAlt, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: S.md, paddingVertical: 10,
    fontSize: T.md, color: C.textPrimary, minHeight: 76, textAlignVertical: 'top', marginBottom: S.base,
  },
  submitBtn: { backgroundColor: C.black, borderRadius: R.md, paddingVertical: 13, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.semibold },
});
