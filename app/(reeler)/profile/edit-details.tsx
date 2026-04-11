import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'mr', label: 'Marathi' },
];

export default function EditDetailsScreen() {
  const { profile, user } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [address, setAddress] = useState((profile as any)?.farm_address ?? '');
  const [language, setLanguage] = useState((profile as any)?.preferred_language ?? 'en');
  const [notifEnabled, setNotifEnabled] = useState((profile as any)?.notification_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => { if (!dirty) setDirty(true); };

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('Error', 'Full name is required.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          preferred_language: language,
          notification_enabled: notifEnabled,
        })
        .eq('user_id', user?.id ?? '');

      if (error) throw new Error(error.message);
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty) {
      Alert.alert('Discard changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Full name */}
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={(t) => { setFullName(t); markDirty(); }}
          placeholder="Enter your full name"
          placeholderTextColor={C.textMuted}
        />

        {/* Address */}
        <Text style={styles.label}>VILLAGE / ADDRESS</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={(t) => { setAddress(t); markDirty(); }}
          placeholder="Village, Taluk, District"
          placeholderTextColor={C.textMuted}
        />

        {/* Language */}
        <Text style={styles.label}>PREFERRED LANGUAGE</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((l) => {
            const active = language === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => { setLanguage(l.code); markDirty(); }}
              >
                <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notification toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Notifications</Text>
            <Text style={styles.toggleDesc}>Receive collection and payment alerts</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={(v) => { setNotifEnabled(v); markDirty(); }}
            trackColor={{ false: C.border, true: C.black }}
            thumbColor={C.white}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
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

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.lg,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 14,
    fontSize: T.md, color: C.textPrimary, backgroundColor: C.white,
  },

  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  langChip: {
    paddingHorizontal: S.md, paddingVertical: 8,
    borderRadius: R.full, borderWidth: 1, borderColor: C.border,
  },
  langChipActive: { backgroundColor: C.black, borderColor: C.black },
  langChipText: { fontSize: T.base, color: C.textSecondary, fontWeight: T.medium },
  langChipTextActive: { color: C.white },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: S.lg, borderTopWidth: 1, borderTopColor: C.border,
    marginTop: S.xl,
  },
  toggleContent: { flex: 1 },
  toggleLabel: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 2 },
  toggleDesc: { fontSize: T.base, color: C.textSecondary },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg },
  saveBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
