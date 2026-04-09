import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const { isAuthenticated, role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'reeler') {
    return <Redirect href="/(reeler)/dashboard" />;
  }

  if (role === 'collector') {
    return <Redirect href="/(collector)/dashboard" />;
  }

  if (role === 'supervisor') {
    return <Redirect href="/(collector)/dashboard" />;
  }

  if (role === 'qc_operator') {
    return <Redirect href="/(gate)/dashboard" />;
  }

  if (role === 'admin') {
    return <Redirect href="/(gate)/dashboard" />;
  }

  // Default fallback
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
