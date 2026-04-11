import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { Stack } from 'expo-router';
import { database } from '@/lib/watermelon/database';
import { startBackgroundSync } from '@/lib/sync/engine';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const { setSession, setUser, setProfile, setLoading } = useAuthStore();
  const initialised = useRef(false);
  const stopSyncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount — use that as the
    // single source of truth. Skip the redundant getSession() call to avoid
    // double state updates that cause redirect loops.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);

        void supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(
            ({ data }) => {
              if (data) setProfile(data);
              setLoading(false);

              // Start background sync only once, after first authenticated session
              if (!initialised.current) {
                initialised.current = true;
                stopSyncRef.current = startBackgroundSync();
              }
            },
            () => {
              setLoading(false);
            },
          );
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);

        // Stop sync if running
        if (stopSyncRef.current) {
          stopSyncRef.current();
          stopSyncRef.current = null;
          initialised.current = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (stopSyncRef.current) {
        stopSyncRef.current();
        stopSyncRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider database={database}>
        <Stack screenOptions={{ headerShown: false }} />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
