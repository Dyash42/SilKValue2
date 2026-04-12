import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { DT } from '@/constants/designTokens';

const { C } = { C: DT.colors };

const hideTabBar = { tabBarStyle: { display: 'none' as const } };

export default function CollectorLayout() {
  const { role, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/(auth)/login'); return; }
    if (role && role !== 'collector' && role !== 'supervisor') { router.replace('/'); }
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
        name="home"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'MAP',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes/index"
        options={{
          title: 'COLLECTIONS',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} />,
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
      <Tabs.Screen name="routes/[routeId]"     options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="navigate-to-stop"     options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="arrived-at-stop"      options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="ticket/new"           options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="ticket/confirm"       options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="skip-stop"            options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="trip-sheet"           options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="settings"             options={{ href: null, ...hideTabBar }} />
      <Tabs.Screen name="logout-modal"         options={{ href: null, ...hideTabBar }} />
    </Tabs>
  );
}
