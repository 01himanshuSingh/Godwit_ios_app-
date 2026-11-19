/**
 * App session markers (Keychain) — clientId scope for features.
 * Firebase Auth RN persistence owns real ID/refresh tokens.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'godwit.accessToken';
const REFRESH_TOKEN_KEY = 'godwit.refreshToken';
const CLIENT_ID_KEY = 'godwit.clientId';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  /** CRM client scope — set only after magic-link + entitlement. */
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
