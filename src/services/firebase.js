import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ─── Firebase config from Vite env vars ───────────────────────────────────────
// In development: values come from .env.local
// In production (Vercel): values come from Vercel Environment Variables dashboard
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that all required keys are present at startup
const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "appId"];
const missingKeys = REQUIRED_KEYS.filter((k) => !firebaseConfig[k]);

if (missingKeys.length > 0) {
  const msg = `Firebase: Missing environment variable(s): ${missingKeys
    .map((k) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, "_$1").toUpperCase()}`)
    .join(", ")}. ` +
    "Add them in your Vercel project settings → Environment Variables.";
  console.error(msg);
  // Throw so the error surfaces immediately rather than silently failing later
  throw new Error(msg);
}

// ─── Singleton Firebase app ───────────────────────────────────────────────────
// getApps() returns [] before first init, so we safely avoid double-init.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Singleton service instances ──────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── Legacy helper (kept for backwards compat) ────────────────────────────────
export function getFirebaseDb() {
  return db;
}

export { app };
