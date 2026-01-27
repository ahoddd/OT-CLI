import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaYOzOPnjEwfylnCV9AwDhB42fpQ-CNZU",
  authDomain: "orbtap.firebaseapp.com",
  projectId: "orbtap",
  storageBucket: "orbtap.firebasestorage.app",
  messagingSenderId: "850131821354",
  appId: "1:850131821354:web:2bedd32c5aeecf74e97453"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
