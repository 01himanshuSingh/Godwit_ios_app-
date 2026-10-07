import * as Linking from 'expo-linking';

import { env } from '@/config/env';
import { type AuthSession, storeSession } from '@/lib/session/bffSession';

export type CompleteMagicLinkInput = {
  email: string;
  linkUrl: string;
};

export type CompleteMagicLinkResult = {
  session: AuthSession;
};

function extractOobCode(linkUrl: string): string | null {
  const parsed = Linking.parse(linkUrl);
  const code = parsed.queryParams?.oobCode ?? parsed.queryParams?.code;
  if (typeof code === 'string' && code.length > 0) {
    return code;
  }
  return null;
}

/**
 * Proposed BFF endpoint — exchanges the link for app access + refresh tokens.
 */
export async function completeMagicLink({
  email,
  linkUrl,
}: CompleteMagicLinkInput): Promise<CompleteMagicLinkResult> {
  const oobCode = extractOobCode(linkUrl);

  const response = await fetch(`${env.apiBaseUrl}/auth/magic-link/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, link: linkUrl, oobCode }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Magic link sign-in failed (${response.status})`);
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    clientId: string;
  };

  const session: AuthSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    clientId: data.clientId,
  };

  await storeSession(session);
  return { session };
}
