/**
 * Temporary dev tenant context from Firestore lookup — NOT production auth.
 * Future: bind to `bffSession` / magic-link; do not use in production builds.
 */

export type TestingClientSession = {
  /** CRM client document id (Firestore `clients/{clientId}`). */
  clientId: string;
  /** Tenant admin id (`admins/{adminId}` parent of the client doc). */
  adminId: string;
  contactEmail: string;
};

/** Email used by `testGetClientByEmail` — change for other test users. */
export const TEST_CLIENT_LOOKUP_EMAIL = 'hr1411687@gmail.com';

/**
 * In-memory values filled by `testGetClientByEmail()` (or paste manually after one successful run).
 * Prefer `getTestingClientSession()` when you need clientId/adminId in features during dev.
 */
export const testingClientSession: TestingClientSession = {
  clientId: '',
  adminId: '',
  contactEmail: TEST_CLIENT_LOOKUP_EMAIL,
};

export function setTestingClientSession(partial: Partial<TestingClientSession>): void {
  Object.assign(testingClientSession, partial);
}

export function getTestingClientSession(): TestingClientSession {
  return testingClientSession;
}

/** Dev helper — returns clientId when lookup has run; otherwise null. */
export function getTestingClientId(): string | null {
  const id = testingClientSession.clientId.trim();
  return id.length > 0 ? id : null;
}

export function getTestingAdminId(): string | null {
  const id = testingClientSession.adminId.trim();
  return id.length > 0 ? id : null;
}
