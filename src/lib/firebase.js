import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely (singleton)
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);
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
