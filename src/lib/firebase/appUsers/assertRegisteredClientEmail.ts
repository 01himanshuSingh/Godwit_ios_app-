import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { env } from '@/config/env';
import { db } from '@/lib/firebase/firestore';
import { getClientByEmailOnly } from '@/lib/firebase/testing/getClientByEmail';

function allowCrmEmailFallback(): boolean {
  if (process.env.EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK === 'false') {
    return false;
  }
  if (process.env.EXPO_PUBLIC_AUTH_ALLOW_CRM_EMAIL_FALLBACK === 'true') {
    return true;
  }
  return env.appEnv === 'development';
}

/**
 * Sign-in only (no sign-up): verify the email belongs to an active provisioned
 * `app_users` client (or CRM `clients` doc in dev) BEFORE sending a Firebase link.
 */
export async function assertRegisteredClientEmail(
  rawEmail: string,
  normalizedEmail: string,
): Promise<void> {
  try {
    const snap = await getDocs(
      query(collection(db, 'app_users'), where('email', '==', normalizedEmail), limit(5)),
    );
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
    // If unauthenticated read of `app_users` is blocked by Firestore rules, fall through to CRM check in dev.
    console.warn('[assertRegisteredClientEmail] app_users pre-check skipped:', error);
  }

  if (allowCrmEmailFallback()) {
    const asTyped = rawEmail.trim();
    const hit =
      (await getClientByEmailOnly(normalizedEmail)) ||
      (asTyped !== normalizedEmail ? await getClientByEmailOnly(asTyped) : null);

    if (hit && hit.clientId.trim() && hit.adminId.trim()) {
      return;
    }
  }

  throw new Error('This email does not belong to a Godwit client.');
}
