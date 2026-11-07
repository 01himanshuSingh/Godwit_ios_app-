/**
 * Testing-only sign-in — CRM client documents only (no Firebase Auth / no Auth users).
 *
 * Path: collectionGroup `clients`
 * Match: contactEmail || email
 * Session: adminId + clientId + name from that client doc
 */

import { getClientByEmailOnly } from '@/lib/firebase/testing/getClientByEmail';
import { setActiveClientProfile } from '@/lib/session/activeClientProfile';
import { storeSession, type AuthSession } from '@/lib/session/bffSession';

export type ClientEmailSignInResult = {
  session: AuthSession;
  clientId: string;
  adminId: string;
  contactEmail: string;
  name: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function lookupClientDocByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) {
    throw new Error('Enter a valid email address.');
  }

  // Firestore equality is case-sensitive — try lowercase, then as typed.
  const asTyped = email.trim();
  const hit =
    (await getClientByEmailOnly(normalized)) ||
    (asTyped !== normalized ? await getClientByEmailOnly(asTyped) : null);

  if (!hit || !hit.adminId.trim() || !hit.clientId.trim()) {
    throw new Error('No client document found for this email.');
  }

  return hit;
}

/** Local stub only — not a Firebase Auth token. */
function buildClientDocSession(clientId: string): AuthSession {
  return {
    accessToken: `client-doc-session:${clientId}`,
    refreshToken: `client-doc-refresh:${clientId}`,
    clientId,
  };
}

/**
 * Validate email against `admins/{adminId}/clients/{clientId}` → persist profile + stub session.
 */
export async function signInWithClientEmail(email: string): Promise<ClientEmailSignInResult> {
  const hit = await lookupClientDocByEmail(email);

  const profile = await setActiveClientProfile({
    clientId: hit.clientId,
    adminId: hit.adminId,
    name: hit.name ?? '',
    contactEmail: hit.contactEmail || normalizeEmail(email),
  });

  const session = buildClientDocSession(profile.clientId);
  await storeSession(session);

  return {
    session,
    clientId: profile.clientId,
    adminId: profile.adminId,
    contactEmail: profile.contactEmail,
    name: profile.name,
  };
}
