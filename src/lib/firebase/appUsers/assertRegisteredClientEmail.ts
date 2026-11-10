import { collection, getDocsFromServer, limit, query, where } from 'firebase/firestore';

import { env } from '@/config/env';
import { db } from '@/lib/firebase/firestore';
import { getClientByEmailOnly } from '@/lib/firebase/testing/getClientByEmail';
import { FirestoreTimeoutError, withFirestoreTimeout } from '@/lib/firebase/withFirestoreTimeout';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

/** Sign-in must not wait through 4×10s Firestore stalls. */
const SIGN_IN_LOOKUP_TIMEOUT_MS = 12_000;

function allowCrmEmailFallback(): boolean {
  if (process.env.EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK === 'false') {
    return false;
  }
  if (process.env.EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK === 'true') {
    return true;
  }
  return env.appEnv === 'development';
}

function isConnectivityError(error: unknown): boolean {
  if (error instanceof FirestoreTimeoutError) {
    return true;
  }
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = `${code} ${message}`.toLowerCase();
  return (
    lower.includes('offline') ||
    lower.includes('unavailable') ||
    lower.includes('network') ||
    lower.includes('timed out') ||
    lower.includes('failed to get document') ||
    lower.includes("backend didn't respond") ||
    lower.includes('backend didnt respond') ||
    lower.includes('deadline-exceeded')
  );
}

function isPermissionError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = `${code} ${message}`.toLowerCase();
  return lower.includes('permission') || lower.includes('insufficient');
}

/**
 * Sign-in only (no sign-up): verify the email belongs to an active provisioned
 * `app_users` client (or CRM `clients` doc in dev) BEFORE sending a Firebase link.
 *
 * Uses getDocsFromServer so offline empty cache is not mistaken for “not a client”.
 */
export async function assertRegisteredClientEmail(
  rawEmail: string,
  normalizedEmail: string,
): Promise<void> {
  let appUsersReachable = false;

  try {
    const snap = await withFirestoreTimeout(
      'assertRegisteredClientEmail.app_users',
      () =>
        withFirestoreRetry(
          'assertRegisteredClientEmail.app_users',
          async () =>
            getDocsFromServer(
              query(collection(db, 'app_users'), where('email', '==', normalizedEmail), limit(5)),
            ),
          { attempts: 2, baseDelayMs: 500 },
        ),
      SIGN_IN_LOOKUP_TIMEOUT_MS,
    );
    appUsersReachable = true;

    if (!snap.empty) {
      const hasActiveClient = snap.docs.some((docSnap) => {
        const d = docSnap.data();
        return d.role === 'client' && d.status === 'active' && Boolean(d.clientId && d.adminId);
      });
      if (hasActiveClient) {
        return;
      }
      throw new Error('This email does not belong to a Godwit client.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not belong')) {
      throw error;
    }
    if (isConnectivityError(error)) {
      throw new Error(
        'Firebase is slow or offline right now. Check Wi‑Fi / mobile data and try again.',
      );
    }
    if (isPermissionError(error)) {
      console.warn('[assertRegisteredClientEmail] app_users permission denied:', error);
    } else {
      console.warn('[assertRegisteredClientEmail] app_users pre-check skipped:', error);
    }
  }

  if (allowCrmEmailFallback()) {
    try {
      const asTyped = rawEmail.trim();
      const hit = await withFirestoreTimeout(
        'assertRegisteredClientEmail.crm',
        async () =>
          (await getClientByEmailOnly(normalizedEmail)) ||
          (asTyped !== normalizedEmail ? await getClientByEmailOnly(asTyped) : null),
        SIGN_IN_LOOKUP_TIMEOUT_MS,
      );

      if (hit && hit.clientId.trim() && hit.adminId.trim()) {
        return;
      }
    } catch (error) {
      if (isConnectivityError(error)) {
        throw new Error(
          'Firebase is slow or offline right now. Check Wi‑Fi / mobile data and try again.',
        );
      }
      console.warn('[assertRegisteredClientEmail] CRM email fallback failed:', error);
      if (!appUsersReachable) {
        throw new Error(
          'Firebase is slow or offline right now. Check Wi‑Fi / mobile data and try again.',
        );
      }
    }
  }

  throw new Error('This email does not belong to a Godwit client.');
}
