/// <reference path="./firebase-auth-react-native.d.ts" />

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { getFirebaseApp } from './app';

let cachedAuth: Auth | undefined;

function createFirebaseAuth(): Auth {
  const firebaseApp = getFirebaseApp();
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

/** Lazy Firebase Auth — file must not be named `auth.ts` (shadows the `firebase/auth` package in Metro). */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = createFirebaseAuth();
  }
  return cachedAuth;
}
