/**
 * Records ToS and Privacy Policy acceptance at signup.
 * Stored in users/{uid} for compliance/audit.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function recordTermsAcceptance(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { termsAcceptedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    if (__DEV__) console.warn('Could not record ToS acceptance:', e);
  }
}
