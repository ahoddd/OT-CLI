/**
 * Listens for notification taps and opens the app to the correct screen (e.g. /vote for polls).
 * Add this inside a router context so we can call router.push(data.url).
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export function NotificationResponseHandler() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const url = typeof data?.url === 'string' ? data.url.trim() : '';
      if (url && url.startsWith('/')) {
        try {
          router.push(url as any);
        } catch (e) {
          if (__DEV__) console.warn('NotificationResponseHandler navigate:', e);
        }
      }
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
