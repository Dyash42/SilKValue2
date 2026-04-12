import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S } = { C: DT.colors, T: DT.type, S: DT.space };

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Map</Text>
      </View>
      <View style={styles.center}>
        <Ionicons name="map-outline" size={64} color={C.textMuted} />
        <Text style={styles.heading}>Map coming soon</Text>
        <Text style={styles.subtitle}>
          Your route stops will be displayed on an interactive map in the next update.
        </Text>
        <Text style={styles.hint}>In the meantime, use the HOME tab to see your stops in order.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: S.base, paddingVertical: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S['2xl'] },
  heading: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary, marginTop: S.lg, marginBottom: S.sm },
  subtitle: { fontSize: T.md, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: S.lg },
  hint: { fontSize: T.base, color: C.textMuted, textAlign: 'center' },
});
