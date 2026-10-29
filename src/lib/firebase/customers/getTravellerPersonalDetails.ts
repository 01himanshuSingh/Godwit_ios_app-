/**
 * Single traveller personal details.
 * Path: admins/{adminId}/customers/{customerId}
 *
 * `mobile` is CRM AES ciphertext — decrypt with CRM key before mapping for UI.
 */

import { doc, getDoc } from 'firebase/firestore';

import { getCrmMobileEncryptionKey } from '@/lib/crypto/crmMobileEncryptionKey';
import { decryptMobile } from '@/lib/crypto/decryptMobile';
import { mapTravellerPersonalDetails } from '@/lib/firebase/customers/mapTravellerPersonalDetails';
import type {
  GetTravellerPersonalDetailsResult,
  TravellerPersonalDetails,
} from '@/lib/firebase/customers/travellerPersonalDetailsTypes';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

function withDecryptedMobile(data: Record<string, unknown>): Record<string, unknown> {
  const key = getCrmMobileEncryptionKey();
  const cipher =
    (typeof data.mobile === 'string' && data.mobile) ||
    (typeof data.phone === 'string' && data.phone) ||
    (typeof data.contactPhone === 'string' && data.contactPhone) ||
    '';
  if (!cipher) return data;

  const plain = decryptMobile(cipher, key);
  return {
    ...data,
    mobile: plain,
    phone: plain,
    contactPhone: plain,
  };
}

export async function getTravellerPersonalDetails(
  adminId: string,
  customerId: string,
): Promise<TravellerPersonalDetails | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  return withFirestoreRetry('getTravellerPersonalDetails', async () => {
    const ref = doc(db, 'admins', aid, 'customers', cid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return mapTravellerPersonalDetails(cid, withDecryptedMobile(snap.data()), ref.path);
  });
}

export async function getTravellerPersonalDetailsSafe(
  adminId: string,
  customerId: string,
): Promise<GetTravellerPersonalDetailsResult> {
  try {
    const details = await getTravellerPersonalDetails(adminId, customerId);
    return { details, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load traveller details';
    console.error('[getTravellerPersonalDetails]', error);
    return { details: null, errorMessage: message };
  }
}
