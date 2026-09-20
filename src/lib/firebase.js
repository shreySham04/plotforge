import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import rawConfig from '../../firebase-applet-config.json';

// Support Vite environment variables (e.g. VITE_FIREBASE_API_KEY) with fallback
const effectiveApiKey = import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || "";

const firebaseConfig = {
  ...rawConfig,
  apiKey: effectiveApiKey,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || "",
};

// Initialize Firebase App safely if apiKey is configured
export const firebaseApp = getApps().length > 0
  ? getApp()
  : (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null);

// Initialize Firebase Auth
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();

// Lazy Firestore accessor - prevents automatic background connection attempts if Firestore is not provisioned
let _db = null;
export const getDb = async () => {
  if (!_db) {
    try {
      const { getFirestore, setLogLevel } = await import('firebase/firestore');
      try {
        setLogLevel('silent');
      } catch (_) {}
      _db = firebaseConfig.firestoreDatabaseId
        ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
        : getFirestore(firebaseApp);
    } catch (e) {
      console.warn("Firestore client not available:", e?.message);
    }
  }
  return _db;
};

// Export db getter for backwards compatibility
export const db = null;
