/**
 * Same secret CRM uses for customer.mobile AES.
 * Set EXPO_PUBLIC_CRM_MOBILE_ENCRYPTION_KEY in .env (dev / until BFF owns decrypt).
 */
export function getCrmMobileEncryptionKey(): string {
  return (process.env.EXPO_PUBLIC_CRM_MOBILE_ENCRYPTION_KEY ?? '').trim();
}
