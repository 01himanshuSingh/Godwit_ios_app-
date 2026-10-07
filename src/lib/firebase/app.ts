import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

function readFirebaseConfig(): FirebaseOptions {
  const config: FirebaseOptions = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const required: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase config: ${missing.join(', ')}. Copy .env.example to .env and set EXPO_PUBLIC_FIREBASE_* values.`,
    );
  }

  return config;
}

export function getFirebaseApp(): FirebaseApp {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }
  return initializeApp(readFirebaseConfig());
}

/** Default app singleton — add `EXPO_PUBLIC_FIREBASE_*` to `.env` before calling Firebase APIs. */
export const app = getFirebaseApp();
