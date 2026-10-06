/**
 * Session helpers for auth tokens. Godwit does not use @react-native-firebase on device;
 * the BFF issues tokens after magic-link / OTP verification.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'godwit.accessToken';
const REFRESH_TOKEN_KEY = 'godwit.refreshToken';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export async function getStoredSession(): Promise<AuthSession | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

export async function storeSession(session: AuthSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
