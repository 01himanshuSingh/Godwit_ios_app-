import { clearPendingAuth } from '@/auth/services/pendingAuthStorage';
import { validateClientAccess } from '@/lib/firebase/appUsers';
import {
  checkIsFirebaseEmailSignInLink,
  signInWithFirebaseEmailLink,
  type User,
} from '@/lib/firebase/firebaseAuth';
import { setActiveClientProfile } from '@/lib/session/activeClientProfile';
import { storeSession, type AuthSession } from '@/lib/session/bffSession';

export type CompleteMagicLinkInput = {
  email: string;
  linkUrl: string;
};

export type CompleteMagicLinkResult = {
  session: AuthSession;
  uid: string;
  clientId: string;
  adminId: string;
  email: string;
  name: string;
};

/**
 * App-scoped session markers — Firebase Auth owns real ID/refresh tokens in its RN persistence.
 * Features still read `clientId` from SecureStore / active profile.
 */
function buildAppSession(clientId: string, uid: string): AuthSession {
  return {
    accessToken: `firebase-auth:${uid}`,
    refreshToken: `firebase-auth-refresh:${uid}`,
    clientId,
  };
}

function mapFirebaseAuthError(error: unknown): Error {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (
    code === 'auth/invalid-action-code' ||
    code === 'auth/expired-action-code' ||
    /invalid-action-code|expired-action-code/i.test(message)
  ) {
    return new Error('This sign-in link has expired or was already used. Request a new link.');
  }
  if (code === 'auth/invalid-email' || /invalid-email/i.test(message)) {
    return new Error('Use the same email address the link was sent to.');
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(message || 'Sign-in failed.');
}

export async function establishClientSessionFromUser(user: User): Promise<CompleteMagicLinkResult> {
  const profile = await validateClientAccess(user.uid);

  await setActiveClientProfile({
    clientId: profile.clientId,
    adminId: profile.adminId,
    name: profile.name,
    contactEmail: profile.email || user.email || '',
  });

  const session = buildAppSession(profile.clientId, user.uid);
  await storeSession(session);
  await clearPendingAuth();

  return {
    session,
    uid: user.uid,
    clientId: profile.clientId,
    adminId: profile.adminId,
    email: profile.email,
    name: profile.name,
  };
}

/**
 * Complete Firebase email-link sign-in (paste in Expo Go, or deep link later).
 */
export async function completeMagicLink({
  email,
  linkUrl,
}: CompleteMagicLinkInput): Promise<CompleteMagicLinkResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const link = linkUrl.trim();

  if (!normalizedEmail.includes('@')) {
    throw new Error('Please enter your email again.');
  }
  if (!link) {
    throw new Error('Paste the sign-in link from your email.');
  }
  if (!checkIsFirebaseEmailSignInLink(link)) {
    throw new Error('Invalid Firebase sign-in link.');
  }

  try {
    const credential = await signInWithFirebaseEmailLink(normalizedEmail, link);
    return await establishClientSessionFromUser(credential.user);
  } catch (error) {
    throw mapFirebaseAuthError(error);
  }
}

export function isFirebaseMagicLink(linkUrl: string): boolean {
  return checkIsFirebaseEmailSignInLink(linkUrl);
}
