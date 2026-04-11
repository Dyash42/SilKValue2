import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w.charAt(0).toUpperCase()).slice(0, 2).join('');
}

export default function LoginReturningScreen() {
  const { profile } = useAuthStore();
  const name = profile?.full_name ?? 'User';

  const handleBiometric = async () => {
    // TODO: integrate expo-local-auth for real biometric
    // For now navigate to dashboard
    router.replace('/');
  };

  const handleDifferentAccount = () => {
    // Clear stored session and go to phone login
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{name}</Text>
        </View>

        <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric} activeOpacity={0.85}>
          <Ionicons name="finger-print-outline" size={22} color={C.white} />
          <Text style={styles.biometricBtnText}>Sign In with Biometric</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pinBtn} onPress={handleBiometric} activeOpacity={0.85}>
          <Ionicons name="keypad-outline" size={18} color={C.textPrimary} />
          <Text style={styles.pinBtnText}>Use PIN Instead</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={handleDifferentAccount}>
          <Text style={styles.switchBtnText}>Use a different account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: S.xl },

  avatarBlock: { alignItems: 'center', marginBottom: 48 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.black,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.lg,
  },
  avatarText: { color: C.white, fontSize: T['5xl'], fontWeight: T.bold },
  greeting: { fontSize: T.lg, color: C.textSecondary, marginBottom: 4 },
  name: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary },

  biometricBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: S.sm,
    marginBottom: S.md,
  },
  biometricBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },

  pinBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: S.sm,
    marginBottom: S['2xl'],
  },
  pinBtnText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  switchBtn: { alignSelf: 'center', paddingVertical: S.sm },
  switchBtnText: { fontSize: T.md, color: C.textSecondary, fontWeight: T.medium },
});
