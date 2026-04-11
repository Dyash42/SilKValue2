import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { DT } from '@/constants/designTokens';

export default function Index() {
  const { isAuthenticated, role, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait until session resolved

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // Route by role
    if (role === 'reeler' || role === 'finance') {
      router.replace('/(reeler)/dashboard');
    } else if (role === 'collector' || role === 'supervisor') {
      router.replace('/(collector)/home');
    } else if (role === 'qc_operator' || role === 'admin') {
      router.replace('/(gate)/overview');
    } else {
      // Unknown role — sign out and go to login
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, role]);

  // Always show a loader while deciding where to go
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={DT.colors.textPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DT.colors.bg,
  },
});
