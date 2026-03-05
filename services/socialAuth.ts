/**
 * OrbTap social sign-in — Google and Apple.
 * Web: Firebase signInWithPopup (Google), signInWithRedirect (Apple — handler: https://orbtap.firebaseapp.com/__/auth/handler).
 * Native: expo-auth-session (Google) and expo-apple-authentication (Apple, iOS).
 */

import { Platform } from 'react-native';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  UserCredential,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth } from '../firebaseConfig';
import { AuthRequest, ResponseType, fetchDiscoveryAsync } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const env = typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>) : {};
const GOOGLE_WEB_CLIENT_ID = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export type SocialAuthResult = { success: true; credential: UserCredential } | { success: false; message: string };

/**
 * Sign in with Google.
 * Web: signInWithPopup. Native: expo-auth-session (OIDC id_token) then signInWithCredential.
 */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  try {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const credential = await signInWithPopup(auth, provider);
      return { success: true, credential };
    }

    // Native: use expo-auth-session to get Google id_token
    if (!GOOGLE_WEB_CLIENT_ID) {
      return { success: false, message: 'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env' };
    }
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true, path: 'auth/google' });
    const nonce = await generateNonce();
    const request = new AuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: ResponseType.IdToken,
      usePKCE: false,
      extraParams: { nonce },
    });
    const discovery = await fetchDiscoveryAsync('https://accounts.google.com');
    const result = await request.promptAsync(discovery);
    if (result.type !== 'success') {
      if (result.type === 'cancel' || result.type === 'dismiss') return { success: false, message: 'Sign-in was cancelled.' };
      return { success: false, message: 'Could not get Google sign-in token. Try again.' };
    }
    const idToken = result.params?.id_token ?? result.authentication?.idToken ?? null;
    if (!idToken) {
      return { success: false, message: 'Google did not return an id token. Try again.' };
    }
    const firebaseCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, firebaseCredential);
    return { success: true, credential: userCredential };
  } catch (e: any) {
    const code = e?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { success: false, message: 'Sign-in was cancelled.' };
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return { success: false, message: 'This email is already linked to another sign-in method. Try email/password or the other method.' };
    }
    return { success: false, message: e?.message ?? 'Google sign-in failed. Try again.' };
  }
}

/**
 * Sign in with Apple.
 * Web: signInWithRedirect (Firebase handler https://orbtap.firebaseapp.com/__/auth/handler).
 * Call handleAppleRedirectResult() on app/login load to complete the flow after redirect.
 * Native iOS: expo-apple-authentication.
 * Android: not supported (returns error or we hide the button).
 */
export async function signInWithApple(): Promise<SocialAuthResult> {
  try {
    if (Platform.OS === 'web') {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithRedirect(auth, provider);
      return { success: false, message: 'Redirecting to Apple…' };
    }

    if (Platform.OS !== 'ios') {
      return { success: false, message: 'Apple Sign-In is only available on iOS.' };
    }

    const rawNonce = await generateNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!appleCredential.identityToken) {
      return { success: false, message: 'Apple Sign-In did not return an identity token.' };
    }

    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce,
    });
    const userCredential = await signInWithCredential(auth, firebaseCredential);
    return { success: true, credential: userCredential };
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, message: 'Sign-in was cancelled.' };
    }
    const code = e?.code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { success: false, message: 'Sign-in was cancelled.' };
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return { success: false, message: 'This email is already linked to another sign-in method.' };
    }
    return { success: false, message: e?.message ?? 'Apple sign-in failed. Try again.' };
  }
}

async function generateNonce(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Whether Apple Sign-In is available (iOS only on native). */
export function isAppleSignInAvailable(): boolean {
  if (Platform.OS === 'web') return true;
  return Platform.OS === 'ios';
}

/** Whether Google Sign-In is available (always true if client ID set on native). */
export function isGoogleSignInAvailable(): boolean {
  if (Platform.OS === 'web') return true;
  return !!GOOGLE_WEB_CLIENT_ID;
}

/**
 * Ensure a social sign-in user has a Firestore profile (e.g. new user).
 * Call after signInWithGoogle or signInWithApple; if users/{uid} doesn't exist, calls initializeUserProfile.
 */
export async function ensureSocialUserProfile(credential: UserCredential): Promise<void> {
  const user = credential.user;
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const { getDoc, doc } = await import('firebase/firestore');
  const { db } = await import('../firebaseConfig');
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;
  const { initializeUserProfileCallable } = await import('./emailVerification');
  await initializeUserProfileCallable(displayName, null);
}

/**
 * On web: call once when login/signup screen mounts to handle return from Apple signInWithRedirect.
 * Firebase redirects to your app after Apple auth; this completes the sign-in.
 * Returns the UserCredential if we landed from an Apple redirect, otherwise null.
 */
export async function handleAppleRedirectResult(): Promise<UserCredential | null> {
  if (Platform.OS !== 'web') return null;
  try {
    const result = await getRedirectResult(auth);
    return result ?? null;
  } catch {
    return null;
  }
}
