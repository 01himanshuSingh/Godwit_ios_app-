/**
 * BFF access/refresh tokens + clientId (Keychain). Separate from Firebase Auth in `src/lib/firebase`.
 */
import * as SecureStore from 'expo-secure-store';

import { staticAuthSession, USE_STATIC_SESSION } from '@/mocks/staticSession';

const ACCESS_TOKEN_KEY = 'godwit.accessToken';
const REFRESH_TOKEN_KEY = 'godwit.refreshToken';
const CLIENT_ID_KEY = 'godwit.clientId';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  /** CRM client scope for BFF /v1 calls — required on every authenticated request. */
  clientId: string;
};

export async function getStoredSession(): Promise<AuthSession | null> {
  const [accessToken, refreshToken, clientId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(CLIENT_ID_KEY),
  ]);

  if (accessToken && refreshToken && clientId) {
    return { accessToken, refreshToken, clientId };
  }

  if (USE_STATIC_SESSION) {
    return staticAuthSession;
  }

  return null;
}

/** Convenience for API adapters — same source as `getStoredSession()`. */
export async function getSessionClientId(): Promise<string | null> {
  const session = await getStoredSession();
  return session?.clientId ?? null;
}

export async function storeSession(session: AuthSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
    SecureStore.setItemAsync(CLIENT_ID_KEY, session.clientId),
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(CLIENT_ID_KEY),
  ]);
}
