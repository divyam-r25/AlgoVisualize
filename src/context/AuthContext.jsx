import { createContext, useCallback, useEffect, useState } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Initialize Firebase
function initializeFirebase() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (!config.apiKey) {
    throw new Error('Firebase configuration is missing. Check .env.local file.');
  }

  if (!getApps().length) {
    return initializeApp(config);
  }
  return getApps()[0];
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Firebase on mount
  useEffect(() => {
    try {
      const app = initializeFirebase();
      const auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          // Create or update user document in Firestore
          try {
            const db = getFirestore(app);
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              });
            } else {
              // Update last login
              await setDoc(
                userRef,
                { lastLogin: new Date().toISOString() },
                { merge: true }
              );
            }
          } catch (dbError) {
            console.error('Failed to sync user to Firestore:', dbError);
          }

          setUser(currentUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const app = initializeFirebase();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email, password, displayName = '') => {
    try {
      setError(null);

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long');
      }

      const app = initializeFirebase();
      const auth = getAuth(app);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name if provided
      if (displayName.trim()) {
        await updateProfile(result.user, { displayName: displayName.trim() });
      }

      return result.user;
    } catch (err) {
      const raw = err.message || 'Failed to create account';
      // Clean up Firebase error messages
      const errorMessage = raw
        .replace('Firebase: ', '')
        .replace(/\(auth\/[^)]+\)\.?/, '')
        .trim();
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    try {
      setError(null);

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const app = initializeFirebase();
      const auth = getAuth(app);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const raw = err.message || 'Failed to sign in';
      const errorMessage = raw
        .replace('Firebase: ', '')
        .replace(/\(auth\/[^)]+\)\.?/, '')
        .trim();
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const app = initializeFirebase();
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send reset email';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      const auth = getAuth();
      await signOut(auth);
      setUser(null);
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign out';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
