/**
 * Registers push token when user is signed in and push is enabled.
 * Saves to Firestore so Cloud Functions can send poll/deadline notifications.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../hooks/usePreferences';
import { registerPushForUser } from '../services/pushNotifications';

export function PushRegistration() {
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const lastRegisteredUid = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!user?.uid || !prefs.pushEnabled || user.uid === lastRegisteredUid.current) return;
    lastRegisteredUid.current = user.uid;
    registerPushForUser(user.uid);
  }, [user?.uid, prefs.pushEnabled]);

  return null;
}
