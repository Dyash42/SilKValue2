import { supabase } from '@/lib/supabase/client';
import * as Auth from '@/lib/supabase/auth';
import type { ProfileRow, UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignInResult {
  success: boolean;
  role: UserRole | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Phone / OTP
// ---------------------------------------------------------------------------

/**
 * Initiates phone-based OTP sign-in. Returns `{ error }` — `error` is null on
 * success. The phone number must be in E.164 format (e.g. +919876543210).
 */
export async function signInWithPhone(
  phone: string,
): Promise<{ error: string | null }> {
  const { error } = await Auth.signInWithPhone(phone);
  return { error: error ? error.message : null };
}

/**
 * Verifies the OTP received by SMS, then fetches the caller's profile row from
 * Supabase. Returns `{ success, role, error }`.
 */
export async function verifyOtpAndFetchProfile(
  phone: string,
  token: string,
): Promise<SignInResult> {
  const { session, error: otpError } = await Auth.verifyOtp(phone, token);

  if (otpError || !session) {
    return {
      success: false,
      role: null,
      error: otpError ? otpError.message : 'OTP verification failed — no session returned.',
    };
  }

  const profile = await fetchProfile(session.user.id);

  if (!profile) {
    return {
      success: false,
      role: null,
      error: 'Authenticated but no profile found for this user. Contact support.',
    };
  }

  return { success: true, role: profile.role, error: null };
}

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

/**
 * Signs in with email and password, then fetches the caller's profile.
 */
export async function signInWithEmailAndFetchProfile(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { session, error: authError } = await Auth.signInWithEmail(email, password);

  if (authError || !session) {
    return {
      success: false,
      role: null,
      error: authError ? authError.message : 'Sign-in failed — no session returned.',
    };
  }

  const profile = await fetchProfile(session.user.id);

  if (!profile) {
    return {
      success: false,
      role: null,
      error: 'Authenticated but no profile found for this user. Contact support.',
    };
  }

  return { success: true, role: profile.role, error: null };
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

/**
 * Fetches the profile row for `userId` (the auth user UUID stored in
 * `profiles.user_id`). Returns null if no row is found or on error.
 */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`fetchProfile failed for user ${userId}: ${error.message}`);
  }

  return data ?? null;
}

/**
 * Updates mutable display fields on a profile row.
 * `display_name` maps to the `full_name` column; `avatar_url` is stored as a
 * key inside `kyc_documents` JSON if needed — here we just persist it as a
 * top-level column alias understood by callers. Only the columns that exist in
 * the database schema are touched.
 *
 * Returns the updated ProfileRow, or null if the row was not found.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<ProfileRow, 'full_name'>>,
): Promise<ProfileRow | null> {
  if (Object.keys(updates).length === 0) {
    return fetchProfile(userId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`updateProfile failed for user ${userId}: ${error.message}`);
  }

  return data ?? null;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Signs the current user out and clears the persisted session.
 */
export async function signOut(): Promise<void> {
  await Auth.signOut();
}

/**
 * Returns the auth user ID from the current session, or null when there is no
 * active session.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await Auth.getCurrentSession();
  return session?.user.id ?? null;
}
