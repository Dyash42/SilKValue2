import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { DT } from '@/constants/designTokens';

const { C, T } = { C: DT.colors, T: DT.type };

export default function ReelerLayout() {
  const { role, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Role guard — if a non-reeler somehow lands here, redirect back to index
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    if (role && role !== 'reeler' && role !== 'finance') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, role]);

  // Tab bar hidden style — for onboarding, setup, and logout-modal screens
  const hideTabBar = { tabBarStyle: { display: 'none' as const } };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.black,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'COLLECTIONS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'PAYMENTS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ── Hidden routes (no tab bar entry, but tab bar VISIBLE) ── */}
      <Tabs.Screen name="notifications"    options={{ href: null }} />
      <Tabs.Screen name="collection-detail" options={{ href: null }} />
      <Tabs.Screen name="payment-detail"   options={{ href: null }} />
      <Tabs.Screen name="withdrawal"       options={{ href: null }} />
      <Tabs.Screen name="earnings"         options={{ href: null }} />
      <Tabs.Screen name="report-table"     options={{ href: null }} />
      <Tabs.Screen name="esg-report"       options={{ href: null }} />

      {/* Profile sub-screens — tab bar VISIBLE */}
      <Tabs.Screen name="profile/edit-details"     options={{ href: null }} />
      <Tabs.Screen name="profile/payment-methods"  options={{ href: null }} />
      <Tabs.Screen name="profile/consent"          options={{ href: null }} />
      <Tabs.Screen name="profile/help"             options={{ href: null }} />
      <Tabs.Screen name="profile/settings"         options={{ href: null }} />

      {/* Logout modal — tab bar HIDDEN */}
      <Tabs.Screen name="profile/logout-modal"     options={{ href: null, ...hideTabBar }} />

      {/* Onboarding sub-screens — tab bar HIDDEN */}
      <Tabs.Screen name="onboarding/basic-details" options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="onboarding/kyc-upload"    options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="onboarding/kyc-pending"   options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="onboarding/kyc-rejected"  options={{ href: null, ...hideTabBar }} />

      {/* Setup sub-screens — tab bar HIDDEN */}
      <Tabs.Screen name="setup/bank-setup"  options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="setup/qr-card"     options={{ href: null, ...hideTabBar }} />
    </Tabs>
  );
}
