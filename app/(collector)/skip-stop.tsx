import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SkipReasonSelector from '@/components/collector/SkipReasonSelector';
import type { SkipReason } from '@/components/collector/SkipReasonSelector';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function SkipStopScreen() {
  const { stopId, routeId } = useLocalSearchParams<{ stopId: string; routeId: string }>();
  const [selected, setSelected] = useState<SkipReason | null>(null);
  const [otherText, setOtherText] = useState('');

  const handleSkip = async () => {
    if (!selected) { Alert.alert('Required', 'Please select a reason to skip.'); return; }
    const isOther = selected === 'Other — explain below';
    if (isOther && !otherText.trim()) { Alert.alert('Required', 'Please describe the reason.'); return; }

    try {
      // Future: update route_stops.status = 'skipped' in WatermelonDB
      // await markStopSkipped(stopId, isOther ? otherText : selected);
      Alert.alert('Skipped', 'Stop has been skipped.', [
        { text: 'OK', onPress: () => {
          if (routeId) { router.push(`/(collector)/routes/${routeId}`); }
          else { router.back(); }
        }},
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to skip stop.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Skip Stop</Text>
          <Text style={styles.subtitle}>Stop — Reeler</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Warning */}
        <View style={styles.warning}>
          <Ionicons name="warning" size={18} color={C.amber} />
          <Text style={styles.warningText}>
            Skipping a stop means no collection will be recorded for this reeler today.
          </Text>
        </View>

        {/* Reason selector */}
        <View style={styles.reasonBlock}>
          <SkipReasonSelector
            selected={selected}
            onSelect={setSelected}
            otherText={otherText}
            onOtherTextChange={setOtherText}
          />
        </View>

        {/* Confirm */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleSkip} activeOpacity={0.85}>
          <Text style={styles.confirmBtnText}>Skip this Stop</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backBtn: { marginRight: S.sm },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  subtitle: { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  warning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.sm,
    backgroundColor: C.amberBg, borderRadius: R.lg, padding: S.md, marginBottom: S.lg,
  },
  warningText: { flex: 1, fontSize: T.md, color: C.amber, lineHeight: 20 },

  reasonBlock: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.xl,
  },

  confirmBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: S.md,
  },
  confirmBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
  cancelLink: { alignItems: 'center', paddingVertical: S.sm },
  cancelText: { fontSize: T.md, color: C.textMuted },
});
