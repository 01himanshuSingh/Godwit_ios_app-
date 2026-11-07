/**
 * Mobile entitlement document: `app_users/{firebaseUid}`.
 * Provisioned by trusted server/CRM — never by the client from raw CRM emails.
 */
export type AppUserRole = 'client';

export type AppUserStatus = 'active' | 'inactive' | 'disabled' | 'pending';

export type AppUserProfile = {
  uid: string;
  email: string;
  clientId: string;
  adminId: string;
  role: AppUserRole;
  status: AppUserStatus;
  /** Optional display name stored on the entitlement doc. */
  name: string;
};
