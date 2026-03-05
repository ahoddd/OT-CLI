/**
 * User notification preferences — stored in Firestore so Cloud Functions
 * can respect them when sending push (polls, missions, drops, partner updates).
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface NotificationPreferences {
  pushEnabled: boolean;
  polls: boolean;
  missionReminders: boolean;
  dropAlerts: boolean;
  partnerUpdates: boolean;
  orbsignalAlerts: boolean;
  /** When friends check in or earn OT — drive engagement and FOMO. */
  friendActivity: boolean;
  /** Stamp card reminders: reward expiring soon, or one stamp away. */
  stampReminders: boolean;
}

/** Push is on by default. Missing Firestore doc is treated as all defaults (push enabled). */
const DEFAULTS: NotificationPreferences = {
  pushEnabled: true,
  polls: true,
  missionReminders: true,
  dropAlerts: true,
  partnerUpdates: false,
  orbsignalAlerts: true,
  friendActivity: true,
  stampReminders: true,
};

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const ref = doc(db, 'users', userId, 'private', 'notificationPreferences');
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) return { ...DEFAULTS };
  return {
    pushEnabled: data.pushEnabled !== false,
    polls: data.polls !== false,
    missionReminders: data.missionReminders !== false,
    dropAlerts: data.dropAlerts !== false,
    partnerUpdates: data.partnerUpdates === true,
    orbsignalAlerts: data.orbsignalAlerts !== false,
    friendActivity: data.friendActivity !== false,
    stampReminders: data.stampReminders !== false,
  };
}

export async function setNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'private', 'notificationPreferences');
  const current = await getNotificationPreferences(userId);
  await setDoc(ref, { ...current, ...prefs }, { merge: true });
}
