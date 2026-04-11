import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function WelcomeScreen() {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const handleContinue = () => {
    // TODO: persist to user_preferences via usePreferences() hook
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoBlock}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SV</Text>
          </View>
          <Text style={styles.title}>Silk Value</Text>
          <Text style={styles.tagline}>Empowering silk cocoon farmers{'\n'}with fair pricing & digital traceability</Text>
        </View>

        {/* Language selector */}
        <Text style={styles.sectionLabel}>SELECT YOUR LANGUAGE</Text>
        <View style={styles.langGrid}>
          {LANGUAGES.map((lang) => {
            const active = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, active && styles.langBtnActive]}
                onPress={() => setSelectedLang(lang.code)}
                activeOpacity={0.8}
              >
                <Text style={[styles.langBtnText, active && styles.langBtnTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selectedLang && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedLang}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: S.xl, paddingTop: 60 },

  logoBlock: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.black,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.base,
  },
  logoText: { color: C.white, fontSize: T['5xl'], fontWeight: T.bold, letterSpacing: 1 },
  title: { fontSize: T['6xl'], fontWeight: T.black, color: C.textPrimary, marginBottom: S.sm },
  tagline: { fontSize: T.md, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1.2, marginBottom: S.md,
  },

  langGrid: { gap: S.sm },
  langBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingVertical: 14, paddingHorizontal: S.base,
    backgroundColor: C.white,
  },
  langBtnActive: { borderColor: C.black, backgroundColor: C.black },
  langBtnText: { fontSize: T.lg, fontWeight: T.medium, color: C.textPrimary, textAlign: 'center' },
  langBtnTextActive: { color: C.white },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg },
  continueBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.3 },
  continueBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
