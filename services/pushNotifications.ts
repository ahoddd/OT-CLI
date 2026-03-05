/**
 * Push notification scaffolding for OrbTap.
 * - Registers for Expo Push and stores token in Firestore.
 * - Cloud Functions (TODO) can send notifications for:
 *   - New poll created (onCreate polls)
 *   - Voting deadline approaching (scheduled)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Platform } from 'react-native';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permissions and get Expo Push Token.
 * Returns null if not a physical device, permissions denied, or projectId missing.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    if (status !== 'granted') {
      return null;
    }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {});
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    if (__DEV__) console.warn('Push: No EAS projectId. Run "eas init" and add projectId to app config for push to work.');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenData.data ?? null;
}

/**
 * Save the push token to Firestore for Cloud Functions to send notifications.
 * Path: users/{uid}/devicePushTokens/{tokenId}
 */
export async function savePushTokenToFirestore(userId: string, expoPushToken: string): Promise<void> {
  if (!expoPushToken?.startsWith('ExponentPushToken[')) return;

  const tokenId = expoPushToken.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 64);
  const ref = doc(db, 'users', userId, 'devicePushTokens', tokenId);

  await setDoc(
    ref,
    {
      expoPushToken,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Full registration flow: get token and save to Firestore.
 */
export async function registerPushForUser(userId: string): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await savePushTokenToFirestore(userId, token);
    }
  } catch (e) {
    if (__DEV__) console.warn('Push registration failed:', e);
  }
}
