/**
 * Travel Documents for one traveller.
 * Path: customerProfile under admins/{adminId}/customers/{customerId}
 * Fields: preferences.passports | visas | memberships
 */

import { getCrmMobileEncryptionKey } from '@/lib/crypto/crmMobileEncryptionKey';
import { loadCustomerProfile } from '@/lib/firebase/customers/loadCustomerProfile';
import { mapTravellerTravelDocs } from '@/lib/firebase/customers/mapTravellerTravelDocs';
import type {
  GetTravellerTravelDocsResult,
  TravellerTravelDocs,
} from '@/lib/firebase/customers/travellerTravelDocTypes';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

export async function getTravellerTravelDocs(
  adminId: string,
  customerId: string,
): Promise<TravellerTravelDocs | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  return withFirestoreRetry('getTravellerTravelDocs', async () => {
    const profile = await loadCustomerProfile(aid, cid);
    const key = getCrmMobileEncryptionKey();
    return mapTravellerTravelDocs(cid, profile, key);
  });
}

export async function getTravellerTravelDocsSafe(
  adminId: string,
  customerId: string,
): Promise<GetTravellerTravelDocsResult> {
  try {
    const travelDocs = await getTravellerTravelDocs(adminId, customerId);
    return { travelDocs, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load travel documents';
    console.error('[getTravellerTravelDocs]', error);
    return { travelDocs: null, errorMessage: message };
  }
}
