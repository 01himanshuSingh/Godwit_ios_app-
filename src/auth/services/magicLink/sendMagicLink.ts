import { clearPendingAuth, savePendingAuth } from '@/auth/services/pendingAuthStorage';
import { assertRegisteredClientEmail } from '@/lib/firebase/appUsers';
import { sendFirebaseSignInLinkToEmail } from '@/lib/firebase/firebaseAuth';

import { getMagicLinkActionCodeSettings } from './actionCodeSettings';

export type SendMagicLinkInput = {
  email: string;
};

export type SendMagicLinkResult = {
  ok: true;
  email: string;
};

/**
 * Request Firebase passwordless email link, then persist pending email for Expo Go paste / restore.
 * Never send a magic link or store `pending_auth_email` for non-client emails.
 */
export async function sendMagicLink({ email }: SendMagicLinkInput): Promise<SendMagicLinkResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) {
    throw new Error('Enter a valid email address.');
  }

  const actionCodeSettings = getMagicLinkActionCodeSettings();

  try {
    await assertRegisteredClientEmail(email, normalized);
    await sendFirebaseSignInLinkToEmail(normalized, actionCodeSettings);
    await savePendingAuth(normalized);
    return { ok: true, email: normalized };
  } catch (error) {
    await clearPendingAuth();
    console.warn('[sendMagicLink] failed:', error);
    throw error;
  }
}
