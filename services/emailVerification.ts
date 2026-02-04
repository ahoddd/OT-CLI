/**
 * OrbTap Email Verification — Verify-Before-Create anti-bot strategy.
 * No account is created until the user proves they control the email (6-digit code).
 * Rate limiting and one-time codes make bulk signups and bots impractical.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword, updateProfile, signInWithCustomToken as firebaseSignInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const DEV_BYPASS_CODE = '123456';

export type RequestCodeResult = { success: true } | { success: false; message: string };
export type VerifyCodeResult =
  | { success: true; customToken: string }
  | { success: false; message: string };

/**
 * Request a 6-digit verification code to be sent to the email.
 * Production: Cloud Function generates code, stores it with short expiry, sends email.
 * Dev: No email sent; use code 123456 to proceed (bypass for testing).
 */
export async function requestVerificationCode(
  email: string,
  password: string,
  displayName: string
): Promise<RequestCodeResult> {
  if (__DEV__) {
    // Dev bypass: no CF call; code "123456" will be accepted in verifyAndCreateUser.
    return { success: true };
  }
  try {
    const functions = getFunctions(auth.app, 'us-central1');
    const requestCode = httpsCallable<
      { email: string; password: string; displayName: string },
      { success: boolean; message?: string }
    >(functions, 'requestVerificationCode');
    const res = await requestCode({ email, password, displayName });
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed to send code' };
  } catch (e: any) {
    return { success: false, message: e?.message ?? 'Verification service unavailable' };
  }
}

/**
 * Verify the 6-digit code and create the account.
 * Production: Cloud Function verifies code, creates user with Admin SDK, returns customToken.
 * Dev: If code is 123456, create user directly with Firebase Auth (no CF).
 */
export async function verifyAndCreateUser(
  email: string,
  code: string,
  password: string,
  displayName: string
): Promise<VerifyCodeResult> {
  if (__DEV__ && code === DEV_BYPASS_CODE) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return { success: true, customToken: '' }; // Already signed in
    } catch (e: any) {
      return { success: false, message: e?.message ?? 'Signup failed' };
    }
  }
  try {
    const functions = getFunctions(auth.app, 'us-central1');
    const verifyCode = httpsCallable<
      { email: string; code: string; password: string; displayName: string },
      { success: boolean; customToken?: string; message?: string }
    >(functions, 'verifyEmailCode');
    const res = await verifyCode({ email, code, password, displayName });
    const data = res.data;
    if (data?.success && data?.customToken) {
      return { success: true, customToken: data.customToken };
    }
    return { success: false, message: data?.message ?? 'Invalid or expired code' };
  } catch (e: any) {
    return { success: false, message: e?.message ?? 'Verification failed' };
  }
}

/**
 * Sign in with custom token (production flow after CF creates the user).
 */
export async function signInWithCustomToken(token: string): Promise<void> {
  await firebaseSignInWithCustomToken(auth, token);
}
