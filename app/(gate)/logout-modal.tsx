import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { useSync } from '@/hooks/useSync';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function LogoutModalScreen() {
  const reset = useAuthStore(s => s.reset);
  const { pendingCount, triggerSync, isSyncing } = useSync();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasPending = (pendingCount ?? 0) > 0;

  const handleSyncNow = async () => {
    try { await triggerSync(); }
    catch { Alert.alert('Sync Error', 'Failed to sync.'); }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync('auth_session');
      reset();
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Sign out failed.');
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <Ionicons name="log-out-outline" size={48} color={C.textPrimary} style={{ marginBottom: S.lg }} />
        <Text style={styles.title}>Sign out?</Text>
        <Text style={styles.body}>
          You will be signed out. All synced entries are safely stored.
          Unsynced entries will be lost.
        </Text>

        {hasPending && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={18} color={C.amber} />
            <Text style={styles.warningText}>
              {pendingCount} unsynced entries — sync before signing out to avoid data loss.
            </Text>
            <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} disabled={isSyncing}>
              <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing…' : 'Sync Now'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutBtn, isLoggingOut && { opacity: 0.5 }]}
          onPress={handleSignOut}
          disabled={isLoggingOut}
          activeOpacity={0.85}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={C.red} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl },
  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: S.md },
  body: { fontSize: T.md, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: S.xl },

  warningCard: {
    backgroundColor: C.amberBg, borderRadius: R.lg,
    padding: S.md, marginBottom: S.xl, width: '100%',
    alignItems: 'center', gap: S.sm,
  },
  warningText: { fontSize: T.base, color: C.amber, textAlign: 'center', lineHeight: 18 },
  syncBtn: {
    borderWidth: 1, borderColor: C.amber, borderRadius: R.sm,
    paddingHorizontal: S.base, paddingVertical: 6, marginTop: S.xs,
  },
  syncBtnText: { fontSize: T.base, fontWeight: T.bold, color: C.amber },

  cancelBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', width: '100%', marginBottom: S.sm,
  },
  cancelBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },

  signOutBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center', width: '100%',
  },
  signOutText: { fontSize: T.lg, fontWeight: T.bold, color: C.red },
});
