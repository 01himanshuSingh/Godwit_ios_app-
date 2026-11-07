import type { AuthSession } from '@/lib/session/bffSession';

/**
 * Dev-only hard-coded session bypass.
 * Keep `false` so testing email login (SignInScreen) can set SecureStore + profile.
 * Set `true` only to force a fixed clientId without the sign-in screen.
 */
export const USE_STATIC_SESSION = false;

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
