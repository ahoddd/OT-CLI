import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// OrbTap Firebase Config — all values from env. Set in .env or EAS secrets; never commit real values.
const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>) : {};
const apiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
const authDomain = env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const storageBucket = env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
const messagingSenderId = env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
const appId = env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
if (!apiKey) {
  throw new Error('Missing EXPO_PUBLIC_FIREBASE_API_KEY. Set in .env (see .env.example). Do not commit .env.');
}
if (!projectId || !appId) {
  throw new Error('Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID or EXPO_PUBLIC_FIREBASE_APP_ID. Set in .env (see .env.example).');
}
const firebaseConfig = {
  apiKey,
  authDomain: authDomain || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: storageBucket || `${projectId}.appspot.com`,
  messagingSenderId: messagingSenderId || '',
  appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth (use getAuth; add React Native persistence later if needed for your Firebase SDK)
const auth = getAuth(app);

// Exports
export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);