import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { DT } from '@/constants/designTokens';

const { C } = { C: DT.colors };

const hideTabBar = { tabBarStyle: { display: 'none' as const } };

export default function GateLayout() {
  const { role, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/(auth)/login'); return; }
    if (role && role !== 'qc_operator' && role !== 'admin') { router.replace('/'); }
  }, [isLoading, isAuthenticated, role]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.black,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          shadowOpacity: 0,
          height: DT.tabBarHeight,
        },
      }}
    >
      {/* ── 4 Visible tabs ── */}
      <Tabs.Screen
        name="overview"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weighment/index"
        options={{
          title: 'CHECK-IN',
          tabBarIcon: ({ color, size }) => <Ionicons name="log-in-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'HISTORY',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />

      {/* ── Hidden stack screens (tab bar HIDDEN) ── */}
      <Tabs.Screen name="qc/[entryId]"         options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="qc/breakdown"          options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="qc/override"           options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="history/[entryId]"     options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="reports"               options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="settings"              options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="logout-modal"          options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="alerts/[entryId]"      options={{ href: null, ...hideTabBar }} />
    </Tabs>
  );
}
