import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function KYCPendingScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Pending icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="time-outline" size={48} color={C.textPrimary} />
        </View>

        <Text style={styles.title}>KYC Under Review</Text>
        <Text style={styles.body}>
          Your documents are being reviewed by our team.{'\n'}
          This usually takes 24–48 hours.
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="document-text-outline" size={16} color={C.textSecondary} />
            <Text style={styles.statusText}>Aadhaar front & back uploaded</Text>
            <Ionicons name="checkmark-circle" size={16} color={C.greenText} />
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="card-outline" size={16} color={C.textSecondary} />
            <Text style={styles.statusText}>Bank document uploaded</Text>
            <Ionicons name="checkmark-circle" size={16} color={C.greenText} />
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={C.textSecondary} />
            <Text style={styles.statusText}>Verification in progress</Text>
            <Ionicons name="hourglass-outline" size={16} color={C.amberText} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => Linking.openURL('https://wa.me/919876543210')}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={18} color={C.textPrimary} />
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
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.xl,
  },

  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: S.md },
  body: {
    fontSize: T.md, color: C.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: S['2xl'],
  },

  statusCard: {
    width: '100%', borderWidth: 1, borderColor: C.border,
    borderRadius: R.lg, backgroundColor: C.white, padding: S.md,
    marginBottom: S.xl, gap: S.md,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  statusText: { flex: 1, fontSize: T.md, color: C.textPrimary },

  supportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, paddingHorizontal: S.xl,
  },
  supportBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
});
