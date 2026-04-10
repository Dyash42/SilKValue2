import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';

const WHITE = '#FFFFFF';
const BLACK = '#000000';

export default function Index() {
  const { isAuthenticated, role, isLoading } = useAuthStore();

  // Still resolving session from storage
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BLACK} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Route by role
  if (role === 'reeler') return <Redirect href="/(reeler)/dashboard" />;
  if (role === 'collector') return <Redirect href="/(collector)/dashboard" />;
  if (role === 'supervisor') return <Redirect href="/(collector)/dashboard" />;
  if (role === 'qc_operator') return <Redirect href="/(gate)/dashboard" />;
  if (role === 'admin') return <Redirect href="/(gate)/dashboard" />;
  if (role === 'finance') return <Redirect href="/(reeler)/dashboard" />;

  // Fallback — unknown role or no profile yet
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
});
