import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase web configuration is public, but permissions MUST be enforced in
// Firestore Security Rules. Do not put server keys or admin secrets here.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const db = config.apiKey && config.projectId
  ? getFirestore(getApps()[0] || initializeApp(config))
  : null;
