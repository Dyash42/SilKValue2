import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Badge from '@/components/shared/Badge';
import QRScannerSheet from '@/components/collector/QRScannerSheet';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function ArrivedAtStopScreen() {
  const { stopId, routeId } = useLocalSearchParams<{ stopId: string; routeId: string }>();
  const [arrivalTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
  const [qrVerified, setQrVerified] = useState(false);
  const [qrBypass, setQrBypass] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  if (showScanner) {
    return (
      <QRScannerSheet
        onScanSuccess={(id) => { setQrVerified(true); setShowScanner(false); }}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  const handleRecordCollection = () => {
    if (!qrVerified && !qrBypass) {
      Alert.alert(
        'QR Not Scanned',
        'Collection will be flagged. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => { setQrBypass(true); router.push({ pathname: '/(collector)/ticket/new', params: { stopId, routeId } }); } },
        ],
      );
      return;
    }
    router.push({ pathname: '/(collector)/ticket/new', params: { stopId, routeId } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Arrived</Text>
          <Text style={styles.subtitle}>Stop — Reeler</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Arrival confirmation */}
        <View style={styles.arrivalCard}>
          <Ionicons name="location" size={40} color={C.textPrimary} />
          <Text style={styles.arrivedLabel}>You've arrived at:</Text>
          <Text style={styles.reelerName}>Reeler</Text>
          <Text style={styles.location}>Village · District</Text>
          <Text style={styles.arrivalTime}>Arrived at {arrivalTime}</Text>
        </View>

        {/* Reeler info */}
        <View style={styles.infoBlock}>
          <InfoRow label="Expected" value="~12.5 kg" />
          <InfoRow label="Previous grade" value="A" />
          <InfoRow label="Prefers" value="UPI" />
        </View>

        {/* QR Scan */}
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Scan Reeler QR to confirm identity</Text>
          {qrVerified ? (
            <View style={styles.qrConfirmed}>
              <Ionicons name="checkmark-circle" size={20} color={C.green} />
              <Text style={styles.qrConfirmedText}>Reeler confirmed</Text>
            </View>
          ) : qrBypass ? (
            <View style={styles.qrWarning}>
              <Ionicons name="warning" size={18} color={C.amber} />
              <Text style={styles.qrWarningText}>QR not scanned — collection will be flagged</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)} activeOpacity={0.85}>
              <Ionicons name="qr-code-outline" size={20} color={C.textPrimary} />
              <Text style={styles.scanBtnText}>Scan QR Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleRecordCollection} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Record Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => router.push({ pathname: '/(collector)/skip-stop', params: { stopId, routeId } })}
        >
          <Text style={styles.skipText}>Skip this Stop</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
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
  subtitle: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  arrivalCard: {
    alignItems: 'center', padding: S.xl,
    borderWidth: 1, borderColor: C.border, borderRadius: R.xl,
    marginBottom: S.lg,
  },
  arrivedLabel: { fontSize: T.md, color: C.textSecondary, marginTop: S.md, marginBottom: S.xs },
  reelerName: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary },
  location: { fontSize: T.md, color: C.textSecondary, marginTop: 2 },
  arrivalTime: { fontSize: T.base, color: C.textMuted, marginTop: S.md },

  infoBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.lg,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { fontSize: T.base, color: C.textSecondary },
  infoValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  qrSection: { marginBottom: S.xl },
  qrLabel: { fontSize: T.base, color: C.textSecondary, marginBottom: S.md },
  scanBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm,
  },
  scanBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },
  qrConfirmed: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  qrConfirmedText: { fontSize: T.md, fontWeight: T.semibold, color: C.green },
  qrWarning: { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.amberBg, padding: S.md, borderRadius: R.md },
  qrWarningText: { flex: 1, fontSize: T.base, color: C.amber },

  primaryBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: S.md,
  },
  primaryBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.white },
  skipLink: { alignItems: 'center', paddingVertical: S.sm },
  skipText: { fontSize: T.md, fontWeight: T.semibold, color: C.red },
});
