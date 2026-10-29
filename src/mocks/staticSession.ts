import type { AuthSession } from '@/lib/session/bffSession';

/**
 * Dev-only stand-in until login persists a real session in SecureStore.
 * Set `USE_STATIC_SESSION` to false once magic-link / OTP storage is wired.
 *
 * Manual session today: edit `clientId` (+ `STATIC_SESSION_ADMIN_ID`) → Profile/Trips
 * load that client's Firestore data. No real login required.
 */
export const USE_STATIC_SESSION = true;

/**
 * Tenant for the static `clientId` — path `admins/{adminId}/clients/{clientId}`.
 * Keep in sync when you change `staticAuthSession.clientId`.
 */
export const STATIC_SESSION_ADMIN_ID = '11EzdfcBKxrLQGULPBfY';

/**
 * Edit `clientId` to switch the manually “logged-in” client.
 * `getStoredSession()` returns this when SecureStore is empty and static mode is on.
 */
export const staticAuthSession: AuthSession = {
  accessToken: 'dev-static-access-token',
  refreshToken: 'dev-static-refresh-token',
  /** Manual session client — Profile/Trips fetch CRM data for this id. */
  clientId: 'dW7BJQMTJoA54JcWO4Cv',
};
