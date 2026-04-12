import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface QRScannerSheetProps {
  onScanSuccess: (reelerId: string) => void;
  onClose: () => void;
}

/**
 * Placeholder QR scanner. Full camera-based scanning requires expo-camera
 * in a custom dev build. This provides a manual-entry fallback.
 */
export default function QRScannerSheet({ onScanSuccess, onClose }: QRScannerSheetProps) {
  const [manualId, setManualId] = useState('');

  const handleScan = () => {
    Alert.alert(
      'Camera Required',
      'QR scanning with expo-camera requires a custom development build. Use manual entry below.',
    );
  };

  const handleManualSubmit = () => {
    if (!manualId.trim()) return;
    onScanSuccess(manualId.trim());
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close" size={24} color={C.textPrimary} />
      </TouchableOpacity>

      {/* Camera placeholder */}
      <View style={styles.cameraPlaceholder}>
        <View style={styles.scanFrame}>
          <Ionicons name="qr-code-outline" size={64} color={C.textMuted} />
        </View>
        <Text style={styles.instructionText}>Point at the reeler's QR code</Text>
      </View>

      <TouchableOpacity style={styles.scanBtn} onPress={handleScan} activeOpacity={0.85}>
        <Ionicons name="camera-outline" size={20} color={C.white} />
        <Text style={styles.scanBtnText}>Open Camera</Text>
      </TouchableOpacity>

      {/* Manual fallback */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.manualLabel}>Enter Reeler ID manually</Text>
      <View style={styles.manualRow}>
        <TextInput
          style={styles.manualInput}
          value={manualId}
          onChangeText={setManualId}
          placeholder="RLR-XX-0000"
          placeholderTextColor={C.textMuted}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.confirmBtn, !manualId.trim() && { opacity: 0.3 }]}
          onPress={handleManualSubmit}
          disabled={!manualId.trim()}
        >
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: S.xl },
  closeBtn: { position: 'absolute', top: S.xl, right: S.xl, zIndex: 10 },
  cameraPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceAlt, borderRadius: R.xl,
    height: 240, marginTop: S['3xl'], marginBottom: S.lg,
  },
  scanFrame: {
    width: 140, height: 140, borderRadius: R.lg,
    borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: S.md,
  },
  instructionText: { fontSize: T.md, color: C.textSecondary },
  scanBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: S.sm, marginBottom: S.xl,
  },
  scanBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { paddingHorizontal: S.md, fontSize: T.base, color: C.textMuted, fontWeight: T.semibold },
  manualLabel: { fontSize: T.base, color: C.textSecondary, marginBottom: S.sm },
  manualRow: { flexDirection: 'row', gap: S.sm },
  manualInput: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingHorizontal: S.md, paddingVertical: 12,
    fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary,
  },
  confirmBtn: {
    backgroundColor: C.black, borderRadius: R.md,
    paddingHorizontal: S.lg, justifyContent: 'center',
  },
  confirmBtnText: { color: C.white, fontSize: T.md, fontWeight: T.bold },
});
