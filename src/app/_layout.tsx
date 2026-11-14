import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { useFonts, InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';
import { PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { UpdateNotification } from '../components/UpdateNotification';
import { getToken } from '@/api/authStore';
import { registerForPush } from '@/lib/push';

SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  const [loaded] = useFonts({
    InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Keep this phone's push token registered, and open the screen a tapped
  // notification points at (data.url, e.g. /order/123 or /shop/track/123).
  useEffect(() => {
    // Push notifications only exist on phones (the web preview has none).
    if (Platform.OS === 'web') return;
    getToken().then((t) => {
      if (t) registerForPush();
    });

    const open = (res: Notifications.NotificationResponse | null) => {
      const url = res?.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as any);
    };
    Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
  if (!loaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F3EC' } }}>
        <Stack.Screen name="(seller)/product/[id]/index" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="switch" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
      <UpdateNotification />
    </QueryClientProvider>
  );
}

