import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// OrbTap Firebase Config — see docs/FIREBASE_CONFIG.md. Env overrides via EXPO_PUBLIC_*.
const env = typeof process !== 'undefined' && process.env ? process.env : {};
const firebaseConfig = {
  apiKey: (env.EXPO_PUBLIC_FIREBASE_API_KEY as string) || "AIzaSyCaYOzOPnjEwfylnCV9AwDhB42fpQ-CNZU",
  authDomain: (env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string) || "orbtap.firebaseapp.com",
  projectId: (env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string) || "orbtap",
  storageBucket: (env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string) || "orbtap.firebasestorage.app",
  messagingSenderId: (env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string) || "850131821354",
  appId: (env.EXPO_PUBLIC_FIREBASE_APP_ID as string) || "1:850131821354:web:2bedd32c5aeecf74e97453",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth with persistence so sign-in survives app restarts (React Native)
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

// Exports
export { auth };
export const db = getFirestore(app);
