import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { Stack } from 'expo-router';
import { database } from '@/lib/watermelon/database';
import { startBackgroundSync } from '@/lib/sync/engine';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const { setSession, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);

        void supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
            setLoading(false);
          }, () => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
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
          .then(({ data }) => {
            if (data) setProfile(data);
            setLoading(false);
          }, () => {
            setLoading(false);
          });
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Start background sync
    const stopSync = startBackgroundSync();

    return () => {
      subscription.unsubscribe();
      stopSync();
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
