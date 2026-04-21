import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// ← Use the shared singleton instances — never re-init Firebase here
import { auth, db } from '../services/firebase';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/** Strip verbose Firebase prefix/suffix from error messages */
function cleanFirebaseError(raw) {
  return (raw || 'An unexpected error occurred')
    .replace('Firebase: ', '')
    .replace(/\(auth\/[^)]+\)\.?/, '')
    .trim();
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Sync user to Firestore on login ──
  async function syncUserToFirestore(firebaseUser) {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName ?? '',
          photoURL: firebaseUser.photoURL ?? '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      } else {
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
      }
    } catch (err) {
      // Non-fatal: auth still works even if Firestore write fails
      console.error('Failed to sync user to Firestore:', err);
    }
  }

  // ── Listen to auth state once on mount ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserToFirestore(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  // ── Google sign-in ──
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      const msg = cleanFirebaseError(err.message);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Email sign-up ──
  const signUpWithEmail = useCallback(async (email, password, displayName = '') => {
    setError(null);

    if (!validateEmail(email)) {
      const msg = 'Please enter a valid email address';
      setError(msg);
      throw new Error(msg);
    }
    if (!validatePassword(password)) {
      const msg = 'Password must be at least 6 characters long';
      setError(msg);
      throw new Error(msg);
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim()) {
        await updateProfile(result.user, { displayName: displayName.trim() });
      }
      return result.user;
    } catch (err) {
      const msg = cleanFirebaseError(err.message);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Email sign-in ──
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);

    if (!validateEmail(email)) {
      const msg = 'Please enter a valid email address';
      setError(msg);
      throw new Error(msg);
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const msg = cleanFirebaseError(err.message);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Password reset ──
  const resetPassword = useCallback(async (email) => {
    setError(null);

    if (!validateEmail(email)) {
      const msg = 'Please enter a valid email address';
      setError(msg);
      throw new Error(msg);
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      const msg = cleanFirebaseError(err.message);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Sign-out ──
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      const msg = cleanFirebaseError(err.message);
      setError(msg);
      throw new Error(msg);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
