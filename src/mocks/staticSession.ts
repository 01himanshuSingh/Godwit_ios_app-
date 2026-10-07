import type { AuthSession } from '@/lib/session/bffSession';

/**
 * Dev-only stand-in until login persists a real session in SecureStore.
 * Set `USE_STATIC_SESSION` to false once magic-link / OTP storage is wired.
 */
export const USE_STATIC_SESSION = true;

/**
 * Edit `clientId` (and other fields) to match your CRM / BFF test tenant.
 * `getStoredSession()` returns this when SecureStore is empty and static mode is on.
 */
export const staticAuthSession: AuthSession = {
  accessToken: 'dev-static-access-token',
  refreshToken: 'dev-static-refresh-token',
  /** Aligned with Testing pinned client for local Expo Go sessions. */
  clientId: 'dW7BJQMTJoA54JcWO4Cv',
};
