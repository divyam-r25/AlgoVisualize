import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

let appInstance = null;
let firestoreInstance = null;

function readFirebaseConfig() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env;

  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_APP_ID) {
    return null;
  }

  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID,
  };
}

export function getFirebaseDb() {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const config = readFirebaseConfig();
  if (!config) {
    throw new Error("Firebase is not configured. Add VITE_FIREBASE_* values in .env.");
  }

  appInstance = getApps().length ? getApps()[0] : initializeApp(config);
  firestoreInstance = getFirestore(appInstance);
  return firestoreInstance;
}
