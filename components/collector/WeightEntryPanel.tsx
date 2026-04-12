import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface WeightEntryPanelProps {
  grossWeight: string;
  tareWeight: string;
  onGrossChange: (v: string) => void;
  onTareChange: (v: string) => void;
  scaleConnected?: boolean;
  onConnectScale?: () => void;
  grossError?: string;
  tareError?: string;
}

export default function WeightEntryPanel({
  grossWeight,
  tareWeight,
  onGrossChange,
  onTareChange,
  scaleConnected = false,
  onConnectScale,
  grossError,
  tareError,
}: WeightEntryPanelProps) {
  const gross = parseFloat(grossWeight) || 0;
  const tare = parseFloat(tareWeight) || 0;
  const net = Math.max(0, gross - tare);

  return (
    <View>
      <Text style={styles.sectionLabel}>WEIGHT</Text>

      <View style={styles.inputsRow}>
        {/* Gross */}
        <View style={styles.inputCol}>
          <Text style={styles.fieldLabel}>Gross Weight (kg)</Text>
          <View style={[styles.inputWrapper, grossError ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              value={grossWeight}
              onChangeText={onGrossChange}
              placeholder="0.00"
              placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad"
              editable={!scaleConnected}
            />
            {onConnectScale && (
              <TouchableOpacity style={styles.scaleBtn} onPress={onConnectScale} activeOpacity={0.8}>
                <View style={[styles.scaleDot, { backgroundColor: scaleConnected ? C.green : C.textMuted }]} />
                <Ionicons name="bluetooth-outline" size={16} color={C.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
          {grossError ? <Text style={styles.errorText}>{grossError}</Text> : null}
        </View>

        {/* Tare */}
        <View style={styles.inputCol}>
          <Text style={styles.fieldLabel}>Tare Weight (kg)</Text>
          <View style={[styles.inputWrapper, tareError ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              value={tareWeight}
              onChangeText={onTareChange}
              placeholder="0.00"
              placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          {tareError ? <Text style={styles.errorText}>{tareError}</Text> : null}
        </View>
      </View>

      {/* Net weight display */}
      <View style={styles.netRow}>
        <Text style={styles.netLabel}>NET WEIGHT</Text>
        <Text style={styles.netValue}>{net.toFixed(2)} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.sm,
  },
  inputsRow: { flexDirection: 'row', gap: S.sm },
  inputCol: { flex: 1 },
  fieldLabel: { fontSize: T.base, fontWeight: T.medium, color: C.textSecondary, marginBottom: S.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    overflow: 'hidden',
  },
  inputError: { borderColor: C.red },
  input: {
    flex: 1, paddingHorizontal: S.md, paddingVertical: 12,
    fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary,
  },
  scaleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: S.sm, paddingVertical: 8,
    borderLeftWidth: 1, borderLeftColor: C.border,
  },
  scaleDot: { width: 6, height: 6, borderRadius: 3 },
  errorText: { fontSize: T.xs, color: C.red, marginTop: 2 },
  netRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surfaceAlt, borderRadius: R.md,
    padding: S.md, marginTop: S.md,
  },
  netLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary, letterSpacing: 0.5 },
  netValue: { fontSize: T['2xl'], fontWeight: T.extrabold, color: C.textPrimary },
});
