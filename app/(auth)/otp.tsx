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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCooldown = () => {
    setCooldown(OTP_RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (!phone) {
      setError('Phone number is missing. Please go back and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { session, error: verifyError } = await verifyOtp(phone, otp);
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      if (session) {
        setSession(session);
        setUser(session.user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
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
      if (resendError) {
        setError(resendError.message);
      } else {
        startCooldown();
        setOtp('');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = phone
    ? phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 *****$3')
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneDisplay}>{maskedPhone}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>OTP Code</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#ADB5BD"
            keyboardType="numeric"
            maxLength={6}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, ''));
              setError(null);
            }}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (loading || otp.length !== 6) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldown > 0 || resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#2D6A4F" />
              ) : cooldown > 0 ? (
                <Text style={styles.resendCooldown}>Resend in {cooldown}s</Text>
              ) : (
                <Text style={styles.resendActive}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 24,
  },
  backButtonText: {
    color: '#2D6A4F',
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  phoneDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D6A4F',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    letterSpacing: 12,
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  resendCooldown: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  resendActive: {
    fontSize: 13,
    color: '#2D6A4F',
    fontWeight: '600',
  },
});
