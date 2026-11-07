/// <reference path="./firebase-auth-react-native.d.ts" />

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type ActionCodeSettings,
  type Auth,
  type Unsubscribe,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { getFirebaseApp } from './app';

export type { ActionCodeSettings, Auth, Unsubscribe, User, UserCredential };

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

export function subscribeFirebaseAuthState(listener: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), listener);
}

export async function signOutFirebaseUser(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export async function sendFirebaseSignInLinkToEmail(
  email: string,
  actionCodeSettings: ActionCodeSettings,
): Promise<void> {
  await sendSignInLinkToEmail(getFirebaseAuth(), email, actionCodeSettings);
}

export function checkIsFirebaseEmailSignInLink(linkUrl: string): boolean {
  try {
    return isSignInWithEmailLink(getFirebaseAuth(), linkUrl.trim());
  } catch {
    return false;
  }
}

export async function signInWithFirebaseEmailLink(
  email: string,
  linkUrl: string,
): Promise<UserCredential> {
  return signInWithEmailLink(getFirebaseAuth(), email, linkUrl);
}
