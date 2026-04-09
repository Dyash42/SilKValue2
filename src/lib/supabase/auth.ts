import type {
  AuthError,
  AuthTokenResponsePassword,
  Session,
  Subscription,
  User,
} from '@supabase/supabase-js';

import { supabase } from './client';

// ---------------------------------------------------------------------------
// Phone / OTP auth
// ---------------------------------------------------------------------------

/**
 * Initiate phone-based OTP sign-in. Supabase sends an SMS to the given number.
 * The phone number must be in E.164 format (e.g. +919876543210).
 */
export async function signInWithPhone(
  phone: string,
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error };
}

/**
 * Verify the OTP received by SMS and complete sign-in.
 * Returns the new Session on success, or an error.
 */
export async function verifyOtp(
  phone: string,
  token: string,
): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { session: data.session ?? null, error };
}

// ---------------------------------------------------------------------------
// Email / password auth
// ---------------------------------------------------------------------------

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ session: Session | null; user: User | null; error: AuthError | null }> {
  const response: AuthTokenResponsePassword = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return {
    session: response.data.session ?? null,
    user: response.data.user ?? null,
    error: response.error,
  };
}

// ---------------------------------------------------------------------------
// Sign-out
// ---------------------------------------------------------------------------

/**
 * Sign out the current user. Clears the persisted session from SecureStore.
 * Throws if the network call fails; callers should handle accordingly.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current session from the in-memory cache (populated from
 * SecureStore on first access). Returns null when no session exists.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Returns the currently authenticated User, or null.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// ---------------------------------------------------------------------------
// Auth state change subscription
// ---------------------------------------------------------------------------

/**
 * Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, …).
 * Returns an unsubscribe function — call it when the listener is no longer needed
 * (e.g. in a React useEffect cleanup).
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  }: { data: { subscription: Subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );

  return () => {
    subscription.unsubscribe();
  };
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * Force-refresh the access token using the stored refresh token.
 * Returns the refreshed Session, or null if the refresh token is missing / expired.
 */
export async function refreshSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    // Swallow the error and return null — callers can re-authenticate
    return null;
  }
  return data.session ?? null;
}
