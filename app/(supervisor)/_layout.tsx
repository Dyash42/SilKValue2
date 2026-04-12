/**
 * app/(supervisor)/_layout.tsx — Silk Value Platform
 *
 * Stack layout for the Supervisor flow.
 * No tab bar — supervisors have a focused single-purpose UI for now.
 * Role guard: only 'supervisor' (and 'admin' for testing) may enter.
 */

import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function SupervisorLayout() {
  const { role, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/(auth)/login'); return; }
    if (role && role !== 'supervisor' && role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, role]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create-route" />
    </Stack>
  );
}
