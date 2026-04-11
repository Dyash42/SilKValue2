import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function KYCRejectedScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Rejection icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="close-circle-outline" size={48} color={C.redText} />
        </View>

        <Text style={styles.title}>KYC Verification Failed</Text>
        <Text style={styles.body}>
          Your documents could not be verified. Please review the reason below and re-upload corrected documents.
        </Text>

        {/* Rejection reason */}
        <View style={styles.reasonCard}>
          <Ionicons name="alert-circle" size={18} color={C.redText} />
          <Text style={styles.reasonText}>
            Document image was blurry or partially obscured. Please upload a clear, well-lit photo of your Aadhaar card.
          </Text>
        </View>

        {/* Re-upload button */}
        <TouchableOpacity
          style={styles.reuploadBtn}
          onPress={() => router.push('/(reeler)/onboarding/kyc-upload')}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={C.white} />
          <Text style={styles.reuploadBtnText}>Re-upload Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => Linking.openURL('mailto:support@silkvalue.in')}
          activeOpacity={0.85}
        >
          <Ionicons name="mail-outline" size={18} color={C.textPrimary} />
          <Text style={styles.supportBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: S['2xl'] },

  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.redBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.xl,
  },

  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: S.md },
  body: {
    fontSize: T.md, color: C.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: S.xl,
  },

  reasonCard: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start',
    gap: S.sm, backgroundColor: C.redBg, borderRadius: R.lg,
    padding: S.md, borderWidth: 1, borderColor: C.red,
    marginBottom: S.xl,
  },
  reasonText: { flex: 1, fontSize: T.md, color: C.redText, lineHeight: 20 },

  reuploadBtn: {
    width: '100%', backgroundColor: C.black, borderRadius: R.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: S.sm, marginBottom: S.md,
  },
  reuploadBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },

  supportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, paddingHorizontal: S.xl,
  },
  supportBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
});
