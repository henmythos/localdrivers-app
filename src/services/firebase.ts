import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDQL8viVWEqOWQ3P1eVl48v2B9KwtEQIZM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "localdrivers26.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "localdrivers26",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "localdrivers26.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1051897287119",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1051897287119:android:0b6d1f108d5fe1756d82ba",
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export type { FirebaseUser };
