import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.stepDot, i < current && styles.stepDotActive]} />
      ))}
      <Text style={styles.stepText}>Step {current} of {total}</Text>
    </View>
  );
}

export default function BasicDetailsScreen() {
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [farmArea, setFarmArea] = useState('');

  const handleLocation = () => {
    Alert.alert('Location', 'GPS location capture will auto-fill your address fields.');
  };

  const handleContinue = () => {
    if (!fullName.trim() || !village.trim() || !district.trim()) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    router.push('/(reeler)/onboarding/kyc-upload');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Basic Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StepIndicator current={1} total={3} />

        <Text style={styles.label}>FULL NAME *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor={C.textMuted}
        />

        <Text style={styles.label}>VILLAGE / TALUK *</Text>
        <TextInput
          style={styles.input}
          value={village}
          onChangeText={setVillage}
          placeholder="Village, Taluk"
          placeholderTextColor={C.textMuted}
        />

        <Text style={styles.label}>DISTRICT *</Text>
        <TextInput
          style={styles.input}
          value={district}
          onChangeText={setDistrict}
          placeholder="District name"
          placeholderTextColor={C.textMuted}
        />

        <TouchableOpacity style={styles.locationBtn} onPress={handleLocation} activeOpacity={0.8}>
          <Ionicons name="location-outline" size={18} color={C.textPrimary} />
          <Text style={styles.locationBtnText}>Use Current Location</Text>
        </TouchableOpacity>

        <Text style={styles.label}>FARM AREA (HECTARES)</Text>
        <TextInput
          style={styles.input}
          value={farmArea}
          onChangeText={setFarmArea}
          placeholder="Optional"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>Save & Continue</Text>
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
  headerTitle: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },

  scrollContent: { padding: S.xl, paddingBottom: S['3xl'] },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xl },
  stepDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.black },
  stepText: { fontSize: T.base, color: C.textMuted, marginLeft: S.sm },

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.lg,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 14,
    fontSize: T.md, color: C.textPrimary,
  },

  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 12, paddingHorizontal: S.md, marginTop: S.md,
  },
  locationBtnText: { fontSize: T.md, fontWeight: T.medium, color: C.textPrimary },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg },
  continueBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  continueBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
