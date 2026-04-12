import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface BluetoothScaleRowProps {
  scaleName?: string | null;
  isConnected?: boolean;
  onConnect?: () => void;
  onForget?: () => void;
}

export default function BluetoothScaleRow({
  scaleName = null,
  isConnected = false,
  onConnect,
  onForget,
}: BluetoothScaleRowProps) {
  const handleConnect = () => {
    if (onConnect) { onConnect(); return; }
    Alert.alert('Bluetooth', 'Bluetooth scale pairing requires a custom development build. Not available in Expo Go.');
  };

  return (
    <View style={styles.row}>
      <Ionicons name="scale-outline" size={22} color={C.textPrimary} />
      <View style={styles.content}>
        <Text style={styles.name}>{scaleName ?? 'No scale paired'}</Text>
        {isConnected && <Text style={styles.connectedLabel}>Connected</Text>}
      </View>
      {isConnected ? (
        <TouchableOpacity onPress={onForget} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.forgetText}>Forget</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.connectBtn} onPress={handleConnect} activeOpacity={0.8}>
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.md, backgroundColor: C.white,
  },
  content: { flex: 1 },
  name: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  connectedLabel: { fontSize: T.xs, color: C.green, fontWeight: T.semibold, marginTop: 2 },
  connectBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.sm,
    paddingHorizontal: S.md, paddingVertical: 6,
  },
  connectText: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary },
  forgetText: { fontSize: T.base, color: C.textMuted },
});
