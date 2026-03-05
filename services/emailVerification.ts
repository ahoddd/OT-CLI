/**
 * OrbTap Email Verification — Firebase built-in flow.
 * User signs up with email/password; we send Firebase's verification link.
 * User verifies by clicking the link (Firebase Console → Authentication → Templates).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

export type BirthDate = { year: number; month: number; day: number };

export type SignUpResult =
  | { success: true; user: User }
  | { success: false; message: string };

/**
 * Create account and send Firebase's verification email (link).
 * Call initializeUserProfile (Cloud Function) after this to create the user doc and founding stats.
 */
export async function signUpWithEmailAndSendVerification(
  email: string,
  password: string,
  displayName: string,
  birthDate?: BirthDate
): Promise<SignUpResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: displayName || email.split('@')[0] });
    await sendEmailVerification(user);
    return { success: true, user };
  } catch (e: any) {
    const code = e?.code;
    if (code === 'auth/email-already-in-use') {
      return { success: false, message: 'This email is already registered. Sign in instead.' };
    }
    if (code === 'auth/weak-password') {
      return { success: false, message: 'Use a stronger password (at least 6 characters).' };
    }
    if (code === 'auth/invalid-email') {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    return { success: false, message: e?.message ?? 'Sign up failed.' };
  }
}

export type InitializeProfileResult = { success: true } | { success: false; message: string };

/**
 * Create the user profile doc and founding stats (call once after signUpWithEmailAndSendVerification).
 * Requires the user to be signed in.
 */
export async function initializeUserProfileCallable(
  displayName: string,
  birthYear: number | null
): Promise<InitializeProfileResult> {
  try {
    const functions = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<
      { displayName: string; birthYear: number | null },
      { success: boolean; message?: string }
    >(functions, 'initializeUserProfile');
    const res = await fn({ displayName: displayName.trim(), birthYear });
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Could not initialize profile.' };
  } catch (e: any) {
    return { success: false, message: e?.message ?? 'Service unavailable.' };
  }
}
