/**
 * Firebase Phone Auth — link a phone number to the current (email) user.
 * Used during onboarding to verify sign-ups and reduce bots/fraud.
 *
 * Web: Firebase JS SDK with RecaptchaVerifier (invisible). SMS sent by Firebase.
 * Native (Expo/iOS/Android): @react-native-firebase/auth verifyPhoneNumber + linkWithCredential. SMS sent by Firebase.
 */

import {
  linkWithPhoneNumber,
  RecaptchaVerifier,
  type User,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export type { ConfirmationResult };

/** E.164: ensure + and country code. */
export function normalizePhoneForE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    return digits.startsWith('1') && digits.length === 11 ? `+${digits}` : `+${digits}`;
  }
  return input.startsWith('+') ? input : `+1${digits}`;
}

export type RequestCodeResult =
  | { success: true; confirmationResult: ConfirmationResult }
  | { success: false; message: string };

/** Native (Expo/iOS/Android) — result of Firebase verifyPhoneNumber (verificationId for confirm step). */
export type RequestCodeResultNative =
  | { success: true; verificationId: string }
  | { success: false; message: string };

/**
 * Create an invisible RecaptchaVerifier for web. Pass the container element ID (e.g. a div in your component).
 * Returns null on native or if document is not available.
 */
export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null;
  if (typeof RecaptchaVerifier === 'undefined') return null;
  try {
    return new RecaptchaVerifier(
      auth,
      containerId,
      {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {},
      }
    );
  } catch {
    return null;
  }
}

/**
 * Send SMS verification code. Web: pass a RecaptchaVerifier (from createRecaptchaVerifier).
 * Returns confirmationResult to pass to confirmPhoneCode. On native, applicationVerifier is null — return error.
 */
export async function requestPhoneVerification(
  user: User,
  phoneNumberE164: string,
  applicationVerifier: RecaptchaVerifier | null
): Promise<RequestCodeResult> {
  if (!phoneNumberE164.startsWith('+') || phoneNumberE164.length < 10) {
    return { success: false, message: 'Enter a valid phone number with country code.' };
  }
  if (user.phoneNumber) {
    return { success: false, message: 'This account already has a verified phone number.' };
  }
  if (!applicationVerifier) {
    return { success: false, message: 'Phone verification is available on the web app. You can verify later in Settings or skip for now.' };
  }
  try {
    const confirmationResult = await linkWithPhoneNumber(user, phoneNumberE164, applicationVerifier);
    return { success: true, confirmationResult };
  } catch (e: any) {
    const code = e?.code;
    if (code === 'auth/invalid-phone-number') {
      return { success: false, message: 'Invalid phone number. Use country code (e.g. +1 for US).' };
    }
    if (code === 'auth/too-many-requests') {
      return { success: false, message: 'Too many attempts. Try again later.' };
    }
    if (code === 'auth/captcha-check-failed') {
      return { success: false, message: 'Verification check failed. Please try again.' };
    }
    return { success: false, message: e?.message ?? 'Could not send code.' };
  }
}

/**
 * Native/Expo: send SMS via Firebase Phone Auth (@react-native-firebase/auth). Returns verificationId to pass to verifyPhoneCodeNative.
 */
export async function requestPhoneVerificationNative(
  phoneNumberE164: string
): Promise<RequestCodeResultNative> {
  if (!phoneNumberE164.startsWith('+') || phoneNumberE164.length < 10) {
    return { success: false, message: 'Enter a valid phone number with country code.' };
  }
  try {
    const RNFirebaseAuth = require('@react-native-firebase/auth').default;
    const rnAuth = RNFirebaseAuth();
    const listener = rnAuth.verifyPhoneNumber(phoneNumberE164);
    const verificationId = await new Promise<string>((resolve, reject) => {
      listener.on(
        'state_changed',
        (snapshot: { state: string; verificationId?: string; error?: { message?: string } }) => {
          if ((snapshot.state === 'sent' || snapshot.state === 'verified') && snapshot.verificationId) {
            resolve(snapshot.verificationId);
          }
          if (snapshot.state === 'error') {
            reject(snapshot.error ?? new Error('Verification failed'));
          }
        },
        (err: { message?: string }) => reject(err ?? new Error('Could not send code'))
      );
    });
    return { success: true, verificationId };
  } catch (e: any) {
    const code = e?.code;
    const msg = e?.message ?? 'Could not send code.';
    if (code === 'auth/invalid-phone-number') {
      return { success: false, message: 'Invalid phone number. Use country code (e.g. +1 for US).' };
    }
    if (code === 'auth/too-many-requests') {
      return { success: false, message: 'Too many attempts. Try again later.' };
    }
    return { success: false, message: msg };
  }
}

/**
 * Native/Expo: verify 6-digit code with Firebase, link phone to current user, write to Firestore.
 */
export async function verifyPhoneCodeNative(
  verificationId: string,
  code: string
): Promise<ConfirmCodeResult> {
  const c = (code || '').replace(/\D/g, '');
  if (c.length < 4) {
    return { success: false, message: 'Enter the 6-digit code from the SMS.' };
  }
  try {
    const { default: rnAuthModule, PhoneAuthProvider } = require('@react-native-firebase/auth');
    const rnAuth = rnAuthModule();
    const currentUser = rnAuth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to verify your phone.' };
    }
    const credential = PhoneAuthProvider.credential(verificationId, c);
    const userCred = await currentUser.linkWithCredential(credential);
    const uid = userCred.user.uid;
    const phoneNumber = userCred.user.phoneNumber;
    if (uid && phoneNumber) {
      await setDoc(
        doc(db, 'users', uid),
        { phoneNumber, phoneVerifiedAt: serverTimestamp() },
        { merge: true }
      );
    }
    return { success: true };
  } catch (e: any) {
    const codeErr = e?.code;
    if (codeErr === 'auth/invalid-verification-code') {
      return { success: false, message: 'Invalid or expired code. Request a new one.' };
    }
    if (codeErr === 'auth/credential-already-in-use') {
      return { success: false, message: 'This phone number is already linked to another account.' };
    }
    if (codeErr === 'auth/provider-already-linked') {
      return { success: true }; // already linked
    }
    return { success: false, message: e?.message ?? 'Verification failed.' };
  }
}

export type ConfirmCodeResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Confirm the SMS code and complete linking. On success, the user's phoneNumber is set on Auth.
 * We then write phoneNumber and phoneVerifiedAt to Firestore users/{uid}.
 */
export async function confirmPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<ConfirmCodeResult> {
  const c = (code || '').replace(/\D/g, '');
  if (c.length < 4) {
    return { success: false, message: 'Enter the 6-digit code from the SMS.' };
  }
  try {
    await confirmationResult.confirm(c);
    const uid = auth.currentUser?.uid;
    const phoneNumber = auth.currentUser?.phoneNumber;
    if (uid && phoneNumber) {
      await setDoc(
        doc(db, 'users', uid),
        { phoneNumber, phoneVerifiedAt: serverTimestamp() },
        { merge: true }
      );
    }
    return { success: true };
  } catch (e: any) {
    const codeErr = e?.code;
    if (codeErr === 'auth/invalid-verification-code') {
      return { success: false, message: 'Invalid or expired code. Request a new one.' };
    }
    return { success: false, message: e?.message ?? 'Verification failed.' };
  }
}
