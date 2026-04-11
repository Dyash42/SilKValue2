import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function UploadTile({ label, onPress, uploaded }: { label: string; onPress: () => void; uploaded: boolean }) {
  return (
    <TouchableOpacity style={[styles.uploadTile, uploaded && styles.uploadTileDone]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons
        name={uploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
        size={28}
        color={uploaded ? C.greenText : C.textMuted}
      />
      <Text style={[styles.uploadLabel, uploaded && { color: C.greenText }]}>{label}</Text>
      <Text style={styles.uploadHint}>{uploaded ? 'Uploaded' : 'Tap to upload'}</Text>
    </TouchableOpacity>
  );
}

export default function KYCUploadScreen() {
  const [aadhaarFront, setAadhaarFront] = useState(false);
  const [aadhaarBack, setAadhaarBack] = useState(false);
  const [bankDoc, setBankDoc] = useState(false);
  const [aadhaarLast4, setAadhaarLast4] = useState('');

  const allUploaded = aadhaarFront && aadhaarBack && bankDoc;

  const handleUpload = (setter: (v: boolean) => void) => {
    // TODO: integrate expo-image-picker
    setter(true);
  };

  const handleSubmit = () => {
    if (!allUploaded) { Alert.alert('Upload Required', 'Please upload all 3 documents.'); return; }
    if (aadhaarLast4.length !== 4) { Alert.alert('Required', 'Enter the last 4 digits of your Aadhaar.'); return; }
    router.push('/(reeler)/onboarding/kyc-pending');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Upload</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 2/3 */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>

        <Text style={styles.instructions}>
          Upload clear photos of your Aadhaar card (front & back) and bank passbook/cancelled cheque.
        </Text>

        <View style={styles.tilesRow}>
          <UploadTile label="Aadhaar Front" onPress={() => handleUpload(setAadhaarFront)} uploaded={aadhaarFront} />
          <UploadTile label="Aadhaar Back" onPress={() => handleUpload(setAadhaarBack)} uploaded={aadhaarBack} />
        </View>
        <UploadTile label="Bank Passbook / Cancelled Cheque" onPress={() => handleUpload(setBankDoc)} uploaded={bankDoc} />

        <Text style={styles.label}>AADHAAR LAST 4 DIGITS</Text>
        <TextInput
          style={styles.input}
          value={aadhaarLast4}
          onChangeText={(t) => setAadhaarLast4(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="1234"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
          maxLength={4}
        />
        <Text style={styles.hint}>We never store your full Aadhaar number.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!allUploaded || aadhaarLast4.length !== 4) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!allUploaded || aadhaarLast4.length !== 4}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>Submit KYC</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },

  scrollContent: { padding: S.xl, paddingBottom: S['3xl'] },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xl },
  stepDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.black },
  stepText: { fontSize: T.base, color: C.textMuted, marginLeft: S.sm },

  instructions: { fontSize: T.md, color: C.textSecondary, lineHeight: 22, marginBottom: S.xl },

  tilesRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  uploadTile: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.lg, alignItems: 'center', gap: S.sm,
    borderStyle: 'dashed', backgroundColor: C.surfaceAlt,
    marginBottom: S.sm,
  },
  uploadTileDone: { borderColor: C.greenText, borderStyle: 'solid', backgroundColor: C.greenBg },
  uploadLabel: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary, textAlign: 'center' },
  uploadHint: { fontSize: T.xs, color: C.textMuted },

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.xl,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 14,
    fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary,
    letterSpacing: 8, textAlign: 'center',
  },
  hint: { fontSize: T.base, color: C.textMuted, marginTop: S.xs, textAlign: 'center' },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg },
  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.3 },
  submitBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
