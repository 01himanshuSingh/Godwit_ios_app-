/**
 * Loyalty programmes for a traveller.
 *
 * Profile: loadCustomerProfile (nested → collectionGroup → legacy)
 * Memberships: profile.preferences.memberships ?? profile.memberships
 * Member name: customers/{customerId}.name
 */

import { doc, getDoc } from 'firebase/firestore';

import { loadCustomerProfile } from '@/lib/firebase/customers/loadCustomerProfile';
import { mapTravellerLoyalty } from '@/lib/firebase/customers/mapTravellerLoyalty';
import type {
  GetTravellerLoyaltyResult,
  TravellerLoyalty,
} from '@/lib/firebase/customers/travellerLoyaltyTypes';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

async function loadTravellerName(adminId: string, customerId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'admins', adminId, 'customers', customerId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const name =
    (typeof data.name === 'string' && data.name.trim()) ||
    (typeof data.fullName === 'string' && data.fullName.trim()) ||
    '';
  return name || null;
}

export async function getTravellerLoyalty(
  adminId: string,
  customerId: string,
  travellerName?: string | null,
): Promise<TravellerLoyalty | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  return withFirestoreRetry('getTravellerLoyalty', async () => {
    const [profileData, nameFromDoc] = await Promise.all([
      loadCustomerProfile(aid, cid),
      travellerName != null && String(travellerName).trim()
        ? Promise.resolve(String(travellerName).trim())
        : loadTravellerName(aid, cid),
    ]);

    return mapTravellerLoyalty(cid, profileData, nameFromDoc);
  });
}

export async function getTravellerLoyaltySafe(
  adminId: string,
  customerId: string,
  travellerName?: string | null,
): Promise<GetTravellerLoyaltyResult> {
  try {
    const loyalty = await getTravellerLoyalty(adminId, customerId, travellerName);
    return { loyalty, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load loyalty programmes';
    console.error('[getTravellerLoyalty]', error);
    return { loyalty: null, errorMessage: message };
  }
}
