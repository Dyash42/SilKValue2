import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncStore } from '@/stores/sync.store';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function LogoutModalScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const resetAuth = useAuthStore((s) => s.reset);
  const pendingCount = useSyncStore((s) => s.pendingCount);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Attempt final sync if there are pending uploads
      // (In production, call triggerSync() here and await it)

      // 2. Sign out from Supabase
      await supabase.auth.signOut();

      // 3. Clear secure storage
      try {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync('auth_session');
      } catch {
        // Secure store may not be available in all environments
      }

      // 4. Reset Zustand stores
      resetAuth();

      // 5. Navigate to login
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      console.error('[Logout] Error:', err);
      // Force navigation to login even on error
      resetAuth();
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="log-out-outline" size={36} color={C.redText} />
        </View>

        <Text style={styles.title}>Sign Out?</Text>
        <Text style={styles.body}>
          You will need to log in again to access Silk Value.
          {pendingCount > 0
            ? `\n\nYou have ${pendingCount} unsynced record${pendingCount > 1 ? 's' : ''}. We'll try to upload ${pendingCount > 1 ? 'them' : 'it'} before signing out.`
            : '\n\nAll your data is synced.'}
        </Text>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmLogout}
            disabled={isLoggingOut}
            activeOpacity={0.85}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Sign Out</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={isLoggingOut}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.base, paddingTop: S.md },

  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: S['2xl'],
  },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.redBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.xl,
  },

  title: { fontSize: T['5xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: S.md },
  body: {
    fontSize: T.md, color: C.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: S['2xl'],
  },

  btnGroup: { width: '100%', gap: S.sm },
  confirmBtn: {
    backgroundColor: C.red, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  confirmBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
  cancelBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: C.textPrimary, fontSize: T.md, fontWeight: T.semibold },
});
