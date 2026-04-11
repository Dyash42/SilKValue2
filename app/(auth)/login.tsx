import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { signInWithPhone } from '@/lib/supabase/auth';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return raw.startsWith('+') ? raw : `+${digits}`;
  };

  const handleSubmit = async () => {
    const formatted = formatPhone(phone.trim());
    if (formatted.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await signInWithPhone(formatted);
      if (authError) {
        setError(authError.message);
      } else {
        router.push({ pathname: '/(auth)/otp', params: { phone: formatted } });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SV</Text>
          </View>
          <Text style={styles.title}>Silk Value</Text>
          <Text style={styles.subtitle}>Cocoon Collection Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardDesc}>Enter your registered mobile number to receive an OTP.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="10-digit mobile number"
              placeholderTextColor={C.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); setError(null); }}
              autoComplete="tel"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnText}>Send OTP</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Offline-first platform for silk cocoon collection</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: S.xl, paddingVertical: 40 },

  /* Header */
  header: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.black,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  logoText: { color: C.white, fontSize: T['4xl'], fontWeight: T.bold, letterSpacing: 1 },
  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary, letterSpacing: 0.3 },
  subtitle: { fontSize: T.base, color: C.textSecondary, marginTop: 4 },

  /* Card */
  card: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
  },
  cardTitle: { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 6 },
  cardDesc: { fontSize: T.base, color: C.textSecondary, marginBottom: S.lg, lineHeight: 18 },

  /* Error */
  errorBox: {
    backgroundColor: C.redBg, borderRadius: R.md, padding: S.md,
    marginBottom: S.base, borderWidth: 1, borderColor: C.red,
  },
  errorText: { color: C.redText, fontSize: T.base },

  /* Phone input */
  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    marginBottom: S.sm, letterSpacing: 0.8,
  },
  phoneRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: C.border,
    borderRadius: R.lg, overflow: 'hidden', marginBottom: S.lg,
  },
  prefix: {
    paddingHorizontal: 14, justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: C.border, backgroundColor: C.surfaceAlt,
  },
  prefixText: { fontSize: T.lg, color: C.textPrimary, fontWeight: T.semibold },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: T.lg, color: C.textPrimary },

  /* Button */
  btn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold, letterSpacing: 0.3 },

  /* Footer */
  footer: { textAlign: 'center', color: C.textMuted, fontSize: T.base, marginTop: 28 },
});
