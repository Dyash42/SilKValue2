import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '../../database';
import { Config } from '../../constants/config';

// ---------------------------------------------------------------------------
// Platform-safe storage adapter.
// On native (iOS/Android): expo-secure-store (encrypted keychain/keystore).
// On web: localStorage (no native APIs available).
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'sb_';

// Lazy-load SecureStore so it is never imported on web (where it crashes).
async function getSecureStore() {
  // Dynamic import keeps it out of the web bundle entirely.
  const mod = await import('expo-secure-store');
  return mod;
}

const webStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(KEY_PREFIX + key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(KEY_PREFIX + key, value);
    } catch { /* quota exceeded or private browsing */ }
  },
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(KEY_PREFIX + key);
    } catch { /* ignore */ }
  },
};

const nativeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const SecureStore = await getSecureStore();
      return await SecureStore.getItemAsync(KEY_PREFIX + key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      const SecureStore = await getSecureStore();
      await SecureStore.setItemAsync(KEY_PREFIX + key, value);
    } catch { /* ignore */ }
  },
  async removeItem(key: string): Promise<void> {
    try {
      const SecureStore = await getSecureStore();
      await SecureStore.deleteItemAsync(KEY_PREFIX + key);
    } catch { /* ignore */ }
  },
};

const storageAdapter = Platform.OS === 'web' ? webStorageAdapter : nativeStorageAdapter;

// ---------------------------------------------------------------------------
// Singleton Supabase client
// ---------------------------------------------------------------------------

export const supabase: SupabaseClient<Database> = createClient<Database>(
  Config.supabase.url,
  Config.supabase.anonKey,
  {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ---------------------------------------------------------------------------
// Helper for service-role / elevated calls (e.g. Edge Functions)
// ---------------------------------------------------------------------------

export function getSupabaseWithAuth(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(Config.supabase.url, Config.supabase.anonKey, {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
