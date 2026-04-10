import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const SURFACE_ALT = '#F5F5F5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const RED = '#EF4444';

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
      <Text style={styles.notesLabel}>NOTES (OPTIONAL)</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add inspection notes…"
        placeholderTextColor={TEXT_MUTED}
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
    padding: 16,
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE_ALT,
    alignItems: 'center',
  },
  btnPassActive: {
    backgroundColor: BLACK,
    borderColor: BLACK,
  },
  btnHoldActive: {
    backgroundColor: SURFACE_ALT,
    borderColor: '#CCCCCC',
  },
  btnFailActive: {
    backgroundColor: WHITE,
    borderColor: RED,
  },
  btnFailInactive: {
    borderColor: RED,
    backgroundColor: WHITE,
  },
  decisionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  textPassActive: {
    color: WHITE,
  },
  textHoldActive: {
    color: TEXT_PRIMARY,
  },
  textFailActive: {
    color: RED,
  },
  textFailInactive: {
    color: RED,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: SURFACE_ALT,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT_PRIMARY,
    minHeight: 76,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: BLACK,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
});
