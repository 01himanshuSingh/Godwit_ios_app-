/**
 * In-memory mirror of the signed-in client — for legacy testing helpers only.
 * Production Home / Trips / Payments must read `useActiveClientProfile()` / magic-link session.
 * Never seed a hardcoded Himanshu (or any) client id here.
 */

export type TestingClientSession = {
  /** CRM client document id (Firestore `clients/{clientId}`). */
  clientId: string;
  /** Tenant admin id (`admins/{adminId}` parent of the client doc). */
  adminId: string;
  contactEmail: string;
  /** CRM `clients.name` — mirrored from active client profile when loaded. */
  name: string;
};

/**
 * Empty until magic-link / profile hydrate fills it via `setTestingClientSession`.
 */
export const testingClientSession: TestingClientSession = {
  clientId: '',
  adminId: '',
  contactEmail: '',
  name: '',
};

/** @deprecated Kept only for orphan TestingClientsScreen copy — do not use in product UI. */
export const TEST_CLIENT_LOOKUP_EMAIL = '';
/** @deprecated */
export const TEST_CLIENT_LOOKUP_ADMIN_ID = '';
/** @deprecated */
export const TEST_CLIENT_LOOKUP_ID = '';

export function setTestingClientSession(partial: Partial<TestingClientSession>): void {
  Object.assign(testingClientSession, partial);
}

export function getTestingClientSession(): TestingClientSession {
  return testingClientSession;
}

export function getTestingClientId(): string | null {
  const id = testingClientSession.clientId.trim();
  return id.length > 0 ? id : null;
}

export function getTestingAdminId(): string | null {
  const id = testingClientSession.adminId.trim();
  return id.length > 0 ? id : null;
}
