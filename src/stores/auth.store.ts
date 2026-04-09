import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { ProfileRow, UserRole } from '@/types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: ProfileRow | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
  user: null,
  session: null,
  profile: null,
  role: null as UserRole | null,
  isLoading: true, // true on startup until we've checked session
  isAuthenticated: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const authStore = create<AuthStore>((set) => ({
  ...initialState,

  setUser: (user) =>
    set(() => ({
      user,
    })),

  setSession: (session) =>
    set(() => ({
      session,
      isAuthenticated: session !== null,
    })),

  setProfile: (profile) =>
    set(() => ({
      profile,
      role: (profile?.role ?? null) as UserRole | null,
    })),

  setLoading: (isLoading) => set(() => ({ isLoading })),

  setError: (error) => set(() => ({ error })),

  reset: () =>
    set(() => ({
      ...initialState,
      isLoading: false, // after explicit reset, we know there's no session
    })),
}));

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Primary store hook — gives access to the full store slice. */
export const useAuthStore = authStore;

/**
 * Typed selector hook.
 * Usage: const user = useAuthStoreSelector((s) => s.user);
 */
export const useAuthStoreSelector = <T>(selector: (state: AuthStore) => T): T =>
  authStore(selector);
