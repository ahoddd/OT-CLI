import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// OrbTap Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCaYOzOPnjEwfylnCV9AwDhB42fpQ-CNZU",
  authDomain: "orbtap.firebaseapp.com",
  projectId: "orbtap",
  storageBucket: "orbtap.firebasestorage.app",
  messagingSenderId: "850131821354",
  appId: "1:850131821354:web:2bedd32c5aeecf74e97453"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
