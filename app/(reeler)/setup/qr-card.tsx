import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function QRCardScreen() {
  const { profile } = useAuthStore();
  const name = profile?.full_name ?? 'Reeler';
  const reelerCode = (profile as any)?.reeler_code ?? 'RLR-XX-0000';

  const handleDownload = () => {
    Alert.alert('Download', 'QR code saved to your device gallery.');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Opening system share dialog...');
  };

  const handleContinue = () => {
    router.replace('/(reeler)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Reeler QR Code</Text>
      </View>

      <View style={styles.content}>
        {/* QR Code placeholder */}
        <View style={styles.qrCard}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color={C.textPrimary} />
          </View>
          <Text style={styles.reelerCode}>{reelerCode}</Text>
          <Text style={styles.reelerName}>{name}</Text>
        </View>

        <Text style={styles.hint}>
          Collectors will scan this QR code at your farm to link collections to your account.
        </Text>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownload} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={20} color={C.textPrimary} />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={20} color={C.textPrimary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
    alignItems: 'center',
  },
  headerTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },

  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: S['2xl'] },

  qrCard: {
    backgroundColor: C.white, borderWidth: 2, borderColor: C.black,
    borderRadius: R.xl, padding: S['2xl'], alignItems: 'center',
    marginBottom: S.xl,
  },
  qrPlaceholder: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.lg,
  },
  reelerCode: {
    fontSize: T['2xl'], fontWeight: T.extrabold, color: C.textPrimary,
    letterSpacing: 1, marginBottom: S.xs,
  },
  reelerName: { fontSize: T.md, color: C.textSecondary },

  hint: {
    fontSize: T.md, color: C.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: S.xl, paddingHorizontal: S.base,
  },

  actionsRow: { flexDirection: 'row', gap: S.md },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 12, paddingHorizontal: S.lg,
  },
  actionBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  footer: { paddingHorizontal: S['2xl'], paddingBottom: S.lg },
  continueBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  continueBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
