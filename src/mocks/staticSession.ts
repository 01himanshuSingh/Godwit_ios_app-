/**
 * Static session bypass removed from product paths.
 * Kept as an empty module so old imports fail loudly if reintroduced incorrectly.
 * Real login: Firebase magic link → `app_users` entitlement → SecureStore clientId.
 */

export const USE_STATIC_SESSION = false as const;
