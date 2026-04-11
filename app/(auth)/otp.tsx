import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { verifyOtp, signInWithPhone } from '@/lib/supabase/auth';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase/client';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const OTP_RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN);

  const { setSession, setUser, setProfile } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCooldown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCooldown = () => {
    setCooldown(OTP_RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter the complete 6-digit OTP.'); return; }
    if (!phone) { setError('Phone number missing. Go back and try again.'); return; }

    setLoading(true);
    setError(null);

    try {
      const { session, error: verifyError } = await verifyOtp(phone, otp);
      if (verifyError) { setError(verifyError.message); return; }
      if (session) {
        setSession(session);
        setUser(session.user);

        // FIX: use user_id not id
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileData) setProfile(profileData);
        router.replace('/');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !phone) return;
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await signInWithPhone(phone);
      if (resendError) { setError(resendError.message); }
      else { startCooldown(); setOtp(''); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally { setResending(false); }
  };

  const maskedPhone = phone
    ? phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 *****$3')
    : '';

  const canVerify = otp.length === 6 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={styles.phone}>{maskedPhone}</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>OTP CODE</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="0  0  0  0  0  0"
            placeholderTextColor={C.textMuted}
            keyboardType="numeric"
            maxLength={6}
            value={otp}
            onChangeText={(t) => { setOtp(t.replace(/\D/g, '')); setError(null); }}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.btn, !canVerify && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={!canVerify}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.btnText}>Verify & Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending}>
              {resending
                ? <ActivityIndicator size="small" color={C.textPrimary} />
                : cooldown > 0
                  ? <Text style={styles.resendCooldown}>Resend in {cooldown}s</Text>
                  : <Text style={styles.resendActive}>Resend OTP</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: S.xl, justifyContent: 'center' },

  backBtn: { position: 'absolute', top: 52, left: S.xl },
  backText: { color: C.textPrimary, fontSize: T.lg, fontWeight: T.medium },

  header: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.surfaceAlt,
    justifyContent: 'center', alignItems: 'center', marginBottom: S.base,
  },
  iconText: { fontSize: 28 },
  title: { fontSize: T['4xl'], fontWeight: T.bold, color: C.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: T.md, color: C.textSecondary },
  phone: { fontSize: T.xl, fontWeight: T.bold, color: C.textPrimary, marginTop: 4 },

  card: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
  },

  errorBox: {
    backgroundColor: C.redBg, borderRadius: R.md, padding: S.md,
    marginBottom: S.base, borderWidth: 1, borderColor: C.red,
  },
  errorText: { color: C.redText, fontSize: T.base },

  label: { fontSize: T.xs, fontWeight: T.bold, color: C.textMuted, marginBottom: S.sm, letterSpacing: 0.8 },
  otpInput: {
    borderWidth: 1.5, borderColor: C.black, borderRadius: R.lg,
    paddingVertical: S.base, fontSize: T['5xl'], fontWeight: T.bold,
    color: C.textPrimary, backgroundColor: C.surfaceAlt,
    letterSpacing: 12, marginBottom: S.lg,
  },

  btn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 15, alignItems: 'center', marginBottom: S.base,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold, letterSpacing: 0.3 },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendLabel: { fontSize: T.base, color: C.textSecondary },
  resendCooldown: { fontSize: T.base, color: C.textMuted },
  resendActive: { fontSize: T.base, color: C.textPrimary, fontWeight: T.bold },
});
