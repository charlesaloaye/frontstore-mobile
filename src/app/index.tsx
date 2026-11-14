import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { getToken, getUserMode, hasSeenOnboarding } from '@/api/authStore';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [mode, setMode] = useState<'seller' | 'buyer'>('seller');

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        const userMode = await getUserMode();
        const hasSeen = await hasSeenOnboarding();
        setMode(userMode);
        setAuthenticated(!!token);
        setSeenOnboarding(hasSeen);
      } catch {
        setAuthenticated(false);
        setSeenOnboarding(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#0B6E4F" />
      </View>
    );
  }

  if (authenticated) {
    return <Redirect href={mode === 'buyer' ? '/shop' : '/home'} />;
  }

  if (seenOnboarding) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/welcome" />;
}
