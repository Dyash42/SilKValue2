import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// Mock BLE devices — actual pairing requires react-native-ble-plx in custom dev build
const MOCK_DEVICES = [
  { id: 'scale-A1', name: 'SilkScale-A1', signal: 3 },
  { id: 'scale-B2', name: 'SilkScale-B2', signal: 2 },
  { id: 'scale-C3', name: 'AgroWeigh-C3', signal: 1 },
];

interface ScalePairingSheetProps {
  pairedScaleId?: string | null;
  pairedScaleName?: string | null;
  onPair: (scaleId: string, scaleName: string) => void;
  onForget: () => void;
  onClose: () => void;
}

export default function ScalePairingSheet({
  pairedScaleId, pairedScaleName, onPair, onForget, onClose,
}: ScalePairingSheetProps) {
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Simulate a brief scan
    setTimeout(() => setScanning(false), 1200);
  };

  const handlePair = (device: typeof MOCK_DEVICES[0]) => {
    Alert.alert('Paired', `Connected to ${device.name}`, [
      { text: 'OK', onPress: () => onPair(device.id, device.name) },
    ]);
  };

  const signalBars = (strength: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <View key={i} style={[styles.signalBar, i < strength && styles.signalBarActive, { height: 6 + i * 4 }]} />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pair Weighing Scale</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Currently paired */}
      {pairedScaleId && (
        <View style={styles.pairedRow}>
          <View style={[styles.pairedDot, { backgroundColor: C.green }]} />
          <Text style={styles.pairedName}>{pairedScaleName ?? pairedScaleId}</Text>
          <TouchableOpacity onPress={onForget}>
            <Text style={styles.forgetText}>Forget</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan button */}
      <TouchableOpacity style={styles.scanBtn} onPress={handleScan} disabled={scanning} activeOpacity={0.85}>
        <Ionicons name="bluetooth-outline" size={18} color={C.white} />
        <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : 'Scan for Devices'}</Text>
      </TouchableOpacity>

      {/* Device list */}
      <FlatList
        data={MOCK_DEVICES}
        keyExtractor={d => d.id}
        renderItem={({ item }) => (
          <View style={styles.deviceRow}>
            <View style={styles.signalBars}>{signalBars(item.signal)}</View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            <TouchableOpacity style={styles.pairBtn} onPress={() => handlePair(item)} activeOpacity={0.85}>
              <Text style={styles.pairBtnText}>Pair</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No devices found. Ensure scale is powered on.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.white, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
    padding: S.base, maxHeight: 440,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },

  pairedRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: S.md, marginBottom: S.md,
  },
  pairedDot: { width: 8, height: 8, borderRadius: 4 },
  pairedName: { flex: 1, fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  forgetText: { fontSize: T.base, color: C.textMuted },

  scanBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, marginBottom: S.lg,
  },
  scanBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },

  deviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  signalBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: 24 },
  signalBar: { width: 4, backgroundColor: C.border, borderRadius: 1 },
  signalBarActive: { backgroundColor: C.textPrimary },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  deviceId: { fontSize: T.xs, color: C.textMuted, fontFamily: 'monospace' },
  pairBtn: { borderWidth: 1, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: S.md, paddingVertical: 6 },
  pairBtnText: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary },

  emptyText: { fontSize: T.md, color: C.textMuted, textAlign: 'center', paddingVertical: S.xl },
});
