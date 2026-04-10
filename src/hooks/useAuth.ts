import { useEffect, useCallback } from 'react';

import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase/client';
import { signOut as authSignOut, onAuthStateChange } from '@/lib/supabase/auth';
import type { ProfileRow } from '@/types';

// ---------------------------------------------------------------------------
// Helper: fetch profile from Supabase
// ---------------------------------------------------------------------------

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[useAuth] Failed to fetch profile:', error.message);
    return null;
  }

  return data as ProfileRow;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const {
    user,
    session,
    profile,
    role,
    isLoading,
    isAuthenticated,
    error,
    setUser,
    setSession,
    setProfile,
    setLoading,
    setError,
    reset,
  } = useAuthStore();

  // -------------------------------------------------------------------------
  // Subscribe to Supabase auth state changes on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    // Immediately check for an existing session so the loading state resolves
    // before the first auth-state-change callback fires.
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        if (!mounted) return;

        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);

          fetchProfile(existingSession.user.id)
            .then((p) => {
              if (mounted) setProfile(p);
            })
            .catch(() => {
              /* ignore — profile is optional at this stage */
            })
            .finally(() => {
              if (mounted) setLoading(false);
            });
        } else {
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setLoading(false);
      });

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((event, incomingSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && incomingSession) {
        setSession(incomingSession);
        setUser(incomingSession.user);
        setLoading(true);

        fetchProfile(incomingSession.user.id)
          .then((p) => {
            if (mounted) {
              setProfile(p);
              setError(null);
            }
          })
          .catch((err: unknown) => {
            if (!mounted) return;
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      } else if (event === 'TOKEN_REFRESHED' && incomingSession) {
        // Keep session & user up to date; no need to re-fetch profile
        setSession(incomingSession);
        setUser(incomingSession.user);
      } else if (event === 'SIGNED_OUT') {
        reset();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // signOut
  // -------------------------------------------------------------------------
  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await authSignOut();
      // reset() will be called by the SIGNED_OUT event handler above,
      // but we reset eagerly here to avoid flickers.
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoading(false);
    }
  }, [reset, setError, setLoading]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    user,
    session,
    profile,
    role,
    isLoading,
    isAuthenticated,
    error,
    signOut,
  } as const;
}
