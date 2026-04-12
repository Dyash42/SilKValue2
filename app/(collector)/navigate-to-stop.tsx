import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// Demo coordinates — replace with real stop GPS once route_stops.location is fetched
const DEMO_LAT = 12.9716;
const DEMO_LNG = 77.5946;

/**
 * Builds a Google Maps directions URL that works on web, iOS, and Android.
 * Uses the universal https://maps.google.com URL so no app-specific scheme
 * is needed, and falls back gracefully on all platforms.
 */
function googleMapsUrl(lat: number, lng: number): string {
  // On Android we can also try the geo: scheme, but the Google Maps universal
  // URL works everywhere including web so we prefer it.
  return `https://maps.google.com/?daddr=${lat},${lng}&travelmode=driving`;
}

export default function NavigateToStopScreen() {
  const { stopId, routeId } = useLocalSearchParams<{ stopId: string; routeId: string }>();
  const [mapsError, setMapsError] = useState<string | null>(null);

  const handleOpenMaps = async () => {
    const url = googleMapsUrl(DEMO_LAT, DEMO_LNG);
    setMapsError(null);
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setMapsError('Could not open Google Maps. Make sure it is installed.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      setMapsError('Could not open Google Maps. Try again.');
    }
  };

  // TODO: add expo-clipboard for copy-address feature

  const handleArrived = () => {
    router.push({ pathname: '/(collector)/arrived-at-stop', params: { stopId, routeId } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Next Stop</Text>
          <Text style={styles.subtitle}>Stop — en route</Text>
        </View>
      </View>

      {/* Stop info card */}
      <View style={styles.card}>
        <Text style={styles.reelerName}>Reeler</Text>
        <Text style={styles.location}>Village · District</Text>
        <View style={styles.row}>
          <Text style={styles.expectedText}>~12.5 kg expected</Text>
        </View>
        <Text style={styles.lastCollected}>Last collected: —</Text>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={40} color={C.textMuted} />
        <Text style={styles.mapText}>Tap "Open in Maps" to navigate via Google Maps</Text>
        <Text style={styles.gpsText}>{DEMO_LAT}° N, {DEMO_LNG}° E</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {mapsError ? (
          <Text style={styles.mapsError}>{mapsError}</Text>
        ) : null}

        <TouchableOpacity style={styles.outlineBtn} onPress={handleOpenMaps} activeOpacity={0.85}>
          <Ionicons name="navigate-outline" size={18} color={C.textPrimary} />
          <Text style={styles.outlineBtnText}>Open in Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleArrived} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={18} color={C.white} />
          <Text style={styles.primaryBtnText}>I've Arrived</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => router.push({ pathname: '/(collector)/skip-stop', params: { stopId, routeId } })}
        >
          <Text style={styles.skipText}>Skip this Stop</Text>
        </TouchableOpacity>
      </View>
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

  card: {
    margin: S.base, borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.base,
  },
  reelerName: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  location: { fontSize: T.md, color: C.textSecondary, marginBottom: S.md },
  row: { marginBottom: S.xs },
  expectedText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  lastCollected: { fontSize: T.base, color: C.textMuted },

  mapPlaceholder: {
    margin: S.base, backgroundColor: C.surfaceAlt, borderRadius: R.lg,
    padding: S.xl, alignItems: 'center', justifyContent: 'center',
    minHeight: 140,
  },
  mapText: { fontSize: T.md, color: C.textSecondary, marginTop: S.sm, textAlign: 'center' },
  gpsText: { fontSize: T.base, color: C.textMuted, marginTop: S.xs, fontFamily: 'monospace' },

  actions: { paddingHorizontal: S.base, marginTop: 'auto', paddingBottom: S.xl },
  mapsError: {
    fontSize: T.base, color: C.redText, textAlign: 'center',
    marginBottom: S.sm, lineHeight: 18,
  },
  outlineBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, marginBottom: S.sm,
  },
  outlineBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary },
  primaryBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.sm, marginBottom: S.md,
  },
  primaryBtnText: { fontSize: T.lg, fontWeight: T.bold, color: C.white },
  skipLink: { alignItems: 'center', paddingVertical: S.sm },
  skipText: { fontSize: T.md, fontWeight: T.semibold, color: C.red },
});
