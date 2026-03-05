/**
 * User referral — record when a new user signs up via someone's invite link.
 * Stored in users/{uid}.referredBy. Cloud Function awards both when referee joins.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function recordReferredBy(userId: string, referrerUid: string): Promise<void> {
  if (!referrerUid.trim() || referrerUid === userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { referredBy: referrerUid.trim(), referredAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    if (__DEV__) console.warn('Could not record referral:', e);
  }
}
