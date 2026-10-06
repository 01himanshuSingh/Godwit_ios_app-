import { env } from '@/config/env';

import { getMagicLinkActionCodeSettings } from './actionCodeSettings';

export type SendMagicLinkInput = {
  email: string;
};

export type SendMagicLinkResult = {
  ok: true;
};

/**
 * Proposed BFF endpoint — backend sends the email link; app never talks to Firebase Auth directly.
 */
export async function sendMagicLink({ email }: SendMagicLinkInput): Promise<SendMagicLinkResult> {
  const actionCodeSettings = getMagicLinkActionCodeSettings();

  const response = await fetch(`${env.apiBaseUrl}/auth/magic-link/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, actionCodeSettings }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Magic link request failed (${response.status})`);
  }

  return { ok: true };
}
