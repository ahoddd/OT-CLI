import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// OrbTap Firebase Config — see docs/FIREBASE_CONFIG.md. All values from env; no secrets in source.
const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>) : {};
const apiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY;
if (!apiKey?.trim()) {
  throw new Error(
    'Missing EXPO_PUBLIC_FIREBASE_API_KEY. Add it to .env (see .env.example). Do not commit the key to git.'
  );
}
const firebaseConfig = {
  apiKey: apiKey.trim(),
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'orbtap.firebaseapp.com',
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'orbtap',
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'orbtap.firebasestorage.app',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '850131821354',
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:850131821354:web:2bedd32c5aeecf74e97453',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth (use getAuth; add React Native persistence later if needed for your Firebase SDK)
const auth = getAuth(app);

// Exports
export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);