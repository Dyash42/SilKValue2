import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSync } from '@/hooks/useSync';
import Input from '@/components/shared/Input';
import ScalePairingSheet from '@/components/gate/ScalePairingSheet';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function SettingsScreen() {
  const { isSyncing, triggerSync, pendingCount, lastSyncedAt } = useSync();
  const [varianceTolerance, setVarianceTolerance] = useState('2.5');
  const [pairedScale, setPairedScale] = useState<{ id: string; name: string } | null>(null);
  const [showScaleSheet, setShowScaleSheet] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const lastSyncLabel = lastSyncedAt
    ? `${Math.round((Date.now() - lastSyncedAt.getTime()) / 60000)} mins ago`
    : 'Never';

  const handleSyncNow = async () => {
    try { await triggerSync(); }
    catch { Alert.alert('Sync Error', 'Failed to sync.'); }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'This will clear all local data and re-sync from the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Done', 'Cache cleared.') },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Variance */}
        <Text style={styles.sectionLabel}>VARIANCE</Text>
        <Input
          label="Variance Tolerance %"
          value={varianceTolerance}
          onChangeText={setVarianceTolerance}
          placeholder="2.5"
          keyboardType="decimal-pad"
        />

        {/* Bluetooth / Scale */}
        <Text style={styles.sectionLabel}>BLUETOOTH / SCALE</Text>
        <View style={styles.scaleRow}>
          <View style={[styles.scaleDot, { backgroundColor: pairedScale ? C.green : C.textMuted }]} />
          <Text style={styles.scaleName}>{pairedScale?.name ?? 'No scale paired'}</Text>
        </View>
        <View style={styles.scaleBtns}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowScaleSheet(true)} activeOpacity={0.85}>
            <Text style={styles.outlineBtnText}>{pairedScale ? 'Change Scale' : 'Pair Scale'}</Text>
          </TouchableOpacity>
          {pairedScale && (
            <TouchableOpacity onPress={() => setPairedScale(null)}>
              <Text style={styles.forgetText}>Forget Scale</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Data */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} disabled={isSyncing} activeOpacity={0.85}>
            <Ionicons name="sync-outline" size={16} color={isSyncing ? C.textMuted : C.textPrimary} />
            <Text style={[styles.syncBtnText, isSyncing && { color: C.textMuted }]}>
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
          <InfoRow label="Last Synced" value={lastSyncLabel} />
          <InfoRow label="Pending Records" value={String(pendingCount ?? 0)} />
          <TouchableOpacity style={styles.clearRow} onPress={handleClearCache}>
            <Text style={styles.clearText}>Clear Local Cache</Text>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>App Version</Text>
          <Text style={styles.versionValue}>{version}</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutLink} onPress={() => router.push('/(gate)/logout-modal')}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Scale pairing modal */}
      <Modal visible={showScaleSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScalePairingSheet
            pairedScaleId={pairedScale?.id}
            pairedScaleName={pairedScale?.name}
            onPair={(id, name) => { setPairedScale({ id, name }); setShowScaleSheet(false); }}
            onForget={() => setPairedScale(null)}
            onClose={() => setShowScaleSheet(false)}
          />
        </View>
      </Modal>
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
  scroll: { padding: S.base, paddingBottom: S['3xl'] },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginTop: S.xl, marginBottom: S.sm,
  },

  scaleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  scaleDot: { width: 8, height: 8, borderRadius: 4 },
  scaleName: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  scaleBtns: { flexDirection: 'row', alignItems: 'center', gap: S.lg, marginBottom: S.sm },
  forgetText: { fontSize: T.base, color: C.textMuted },

  card: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    overflow: 'hidden', marginBottom: S.sm,
  },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  syncBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { fontSize: T.base, color: C.textSecondary },
  infoValue: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  clearRow: { paddingHorizontal: S.base, paddingVertical: 14 },
  clearText: { fontSize: T.md, fontWeight: T.semibold, color: C.red },

  outlineBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingHorizontal: S.base, paddingVertical: 8,
  },
  outlineBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  versionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: S.md, marginTop: S.xl,
  },
  versionLabel: { fontSize: T.base, color: C.textMuted },
  versionValue: { fontSize: T.base, color: C.textMuted },

  signOutLink: { alignItems: 'center', paddingVertical: S.xl },
  signOutText: { fontSize: T.lg, fontWeight: T.bold, color: C.red },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
});
