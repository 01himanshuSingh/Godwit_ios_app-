/**
 * After Firebase Auth, prove mobile entitlement via `app_users/{uid}`.
 *
 * Dev-only fallback: if the doc is missing and CRM email lookup finds a client,
 * allow access so Expo Go magic-link can be tested before provisioning exists.
 * Production must rely on provisioned `app_users` + security rules.
 */
import { signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { getFirebaseAuth } from '@/lib/firebase/firebaseAuth';
import { db } from '@/lib/firebase/firestore';
import { getClientByEmailOnly } from '@/lib/firebase/testing/getClientByEmail';
import { env } from '@/config/env';

import type { AppUserProfile, AppUserStatus } from './appUserTypes';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function allowCrmEmailFallback(): boolean {
  if (process.env.EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK === 'false') {
    return false;
  }
  if (process.env.EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK === 'true') {
    return true;
  }
  return env.appEnv === 'development';
}

async function denyAndSignOut(message: string): Promise<never> {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore
  }
  throw new Error(message);
}

export async function validateClientAccess(uid: string): Promise<AppUserProfile> {
  const auth = getFirebaseAuth();
  // Force token refresh so custom claims ({ role, clientId, adminId }) are active for Firestore Rules.
  await auth.currentUser?.getIdTokenResult(true);

  const email = (auth.currentUser?.email ?? '').trim().toLowerCase();
  const userRef = doc(db, 'app_users', uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    const role = readString(data.role);
    const status = readString(data.status) as AppUserStatus;
    const clientId = readString(data.clientId);
    const adminId = readString(data.adminId);

    if (role !== 'client') {
      await denyAndSignOut('Your account does not have mobile app access.');
    }
    if (status !== 'active') {
      await denyAndSignOut('Your account does not have mobile app access.');
    }
    if (!clientId || !adminId) {
      await denyAndSignOut('No Godwit client account found.');
    }

    // Record login timestamp (non-blocking).
    updateDoc(userRef, { lastLoginAt: serverTimestamp() }).catch(() => {});

    return {
      uid,
      email: readString(data.email).toLowerCase() || email,
      clientId,
      adminId,
      role: 'client',
      status: 'active',
      name: readString(data.name),
    };
  }

  if (!allowCrmEmailFallback()) {
    await denyAndSignOut('No Godwit client account found.');
  }

  if (!email.includes('@')) {
    await denyAndSignOut('No Godwit client account found.');
  }

  console.warn(
    '[validateClientAccess] app_users missing — using development CRM email fallback. Provision app_users/{uid} for production.',
  );

  const hit =
    (await getClientByEmailOnly(email)) ||
    (await getClientByEmailOnly(auth.currentUser?.email?.trim() ?? ''));

  if (hit && hit.clientId.trim() && hit.adminId.trim()) {
    return {
      uid,
      email: hit.contactEmail || email,
      clientId: hit.clientId,
      adminId: hit.adminId,
      role: 'client',
      status: 'active',
      name: hit.name ?? '',
    };
  }

  return await denyAndSignOut('No Godwit client account found.');
}
