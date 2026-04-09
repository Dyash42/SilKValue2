import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import type { Database } from '../../database';
import { Config } from '../../constants/config';

// ---------------------------------------------------------------------------
// SecureStore adapter — implements the AsyncStorage-compatible interface
// that @supabase/supabase-js expects for session persistence.
// expo-secure-store keys must be ≤ 2048 bytes, so we use a stable prefix.
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'sb_';

const ExpoSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_PREFIX + key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(KEY_PREFIX + key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_PREFIX + key);
  },
};

// ---------------------------------------------------------------------------
// Singleton Supabase client
// ---------------------------------------------------------------------------

export const supabase: SupabaseClient<Database> = createClient<Database>(
  Config.supabase.url,
  Config.supabase.anonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ---------------------------------------------------------------------------
// Helper for service-role / elevated calls (e.g. Edge Functions)
// Creates a one-off client with a user JWT injected as the Authorization header.
// ---------------------------------------------------------------------------

export function getSupabaseWithAuth(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(Config.supabase.url, Config.supabase.anonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
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
