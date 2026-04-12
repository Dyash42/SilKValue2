import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const REASONS = [
  'Reeler absent — not home when arrived',
  'Access denied — reeler refused collection',
  'Bad weather — conditions prevent access',
  'Vehicle issue — vehicle breakdown or problem',
  'Other — explain below',
] as const;

export type SkipReason = typeof REASONS[number];

interface SkipReasonSelectorProps {
  selected: SkipReason | null;
  onSelect: (r: SkipReason) => void;
  otherText: string;
  onOtherTextChange: (t: string) => void;
}

export default function SkipReasonSelector({
  selected, onSelect, otherText, onOtherTextChange,
}: SkipReasonSelectorProps) {
  const isOther = selected === 'Other — explain below';

  return (
    <View>
      {REASONS.map((reason) => {
        const active = selected === reason;
        return (
          <TouchableOpacity
            key={reason}
            style={[styles.row, active && styles.rowActive]}
            onPress={() => onSelect(reason)}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.reasonText}>{reason.split(' — ')[0]}</Text>
          </TouchableOpacity>
        );
      })}
      {isOther && (
        <TextInput
          style={styles.otherInput}
          value={otherText}
          onChangeText={onOtherTextChange}
          placeholder="Describe the reason…"
          placeholderTextColor={C.textMuted}
          multiline
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 14, paddingHorizontal: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowActive: { backgroundColor: C.surfaceAlt },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.black },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.black },
  reasonText: { flex: 1, fontSize: T.md, color: C.textPrimary },
  otherInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, fontSize: T.md, color: C.textPrimary,
    minHeight: 80, textAlignVertical: 'top', margin: S.md,
  },
});
