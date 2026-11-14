import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { apiDelete, apiPost } from '@/api/client';

const PUSH_TOKEN_KEY = 'frontstore_push_token';

// Show notifications while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * iPhone only: ask for permission, get this phone's Expo push token and
 * register it with the backend for the signed-in account. Safe to call
 * repeatedly; does nothing on simulators or if the user says no.
 *
 * Android is skipped on purpose: Android push always goes through Firebase
 * Cloud Messaging, which we don't use. Android users get order updates on
 * WhatsApp instead (the backend sends those for every status change).
 */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS !== 'ios' || !Device.isDevice) return;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await apiPost('/user/push-tokens', { token, device_type: Platform.OS });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (err) {
    // The app works without push.
    console.warn('Push registration skipped', err);
  }
}

/** Stop sending pushes for this account to this phone (call before signing out). */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!token) return;
    await apiDelete('/user/push-tokens', { token });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (err) {
    console.warn('Push unregister failed', err);
  }
}
