import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as fbSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Capacitor } from '@capacitor/core';

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  imageUrl: string | null;
  primaryEmailAddress?: { emailAddress: string };
  primaryPhoneNumber?: { phoneNumber: string };
}

export interface AuthContextType {
  user: AuthUser | null;
  rawUser: FirebaseUser | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  signInWithGoogle: (redirectUrl?: string) => Promise<AuthUser | null>;
  signOut: (callback?: () => void) => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  rawUser: null,
  isSignedIn: false,
  isLoaded: false,
  signInWithGoogle: async () => null,
  signOut: async () => {},
  getToken: async () => null,
});

export const formatFirebaseUser = (fbUser: FirebaseUser | null): AuthUser | null => {
  if (!fbUser) return null;
  const fullName = fbUser.displayName || '';
  const parts = fullName.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const email = fbUser.email || '';
  const photoURL = fbUser.photoURL || '';
  const phoneNumber = fbUser.phoneNumber || '';

  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    fullName: fullName || (email ? email.split('@')[0] : 'User'),
    firstName: firstName || 'User',
    lastName,
    phoneNumber: fbUser.phoneNumber,
    photoURL,
    imageUrl: photoURL,
    primaryEmailAddress: email ? { emailAddress: email } : undefined,
    primaryPhoneNumber: phoneNumber ? { phoneNumber } : undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawUser, setRawUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Check if coming back from redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setRawUser(result.user);
          setUser(formatFirebaseUser(result.user));
        }
      })
      .catch((err) => {
        console.warn('[FirebaseAuth] Redirect result error:', err);
      });

    // Listen to live auth changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setRawUser(fbUser);
      setUser(formatFirebaseUser(fbUser));
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (redirectUrl?: string): Promise<AuthUser | null> => {
    try {
      // In native Capacitor or if popup is blocked, use redirect
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      // On web browser, popup is standard and doesn't wipe current route state
      const result = await signInWithPopup(auth, googleProvider);
      const formatted = formatFirebaseUser(result.user);
      setRawUser(result.user);
      setUser(formatted);
      return formatted;
    } catch (err: any) {
      console.warn('[FirebaseAuth] Popup sign-in error, trying redirect fallback:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return null;
        } catch (redirErr) {
          console.error('[FirebaseAuth] Redirect fallback error:', redirErr);
          throw redirErr;
        }
      }
      throw err;
    }
  };

  const signOut = async (callback?: () => void): Promise<void> => {
    try {
      await fbSignOut(auth);
      setRawUser(null);
      setUser(null);
      localStorage.removeItem('localdrivers_session_admin');
      localStorage.removeItem('localdrivers_admin_token');
      localStorage.removeItem('localdrivers_admin_username');
      localStorage.removeItem('localdrivers_driver_token');
      localStorage.removeItem('localdrivers_driver_id');
      localStorage.removeItem('localdrivers_driver_phone');
      if (callback) {
        callback();
      }
    } catch (err) {
      console.error('[FirebaseAuth] Sign out error:', err);
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (!rawUser) return null;
    try {
      return await rawUser.getIdToken();
    } catch (err) {
      console.error('[FirebaseAuth] Error getting ID token:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        isSignedIn: Boolean(user),
        isLoaded,
        signInWithGoogle,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
// Provide useUser() and useClerk() aliases for full drop-in compatibility across the app!
export const useUser = () => {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
};
export const useClerk = () => {
  const { signOut } = useAuth();
  return { signOut };
};
