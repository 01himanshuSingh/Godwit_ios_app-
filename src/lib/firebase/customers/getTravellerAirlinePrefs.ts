/**
 * Commercial airline prefs for one traveller (and batch for a client).
 *
 * Path: loadCustomerProfile → preferences
 *   mealRequests / preferredSeating / vipServices ✅
 *   preferredAirlines ❌ null until CRM
 */

import { getTravellersForClient } from '@/lib/firebase/customers/getTravellersForClient';
import { loadCustomerProfile } from '@/lib/firebase/customers/loadCustomerProfile';
import { mapTravellerAirlinePrefs } from '@/lib/firebase/customers/mapTravellerAirlinePrefs';
import type {
  GetTravellerAirlinePrefsResult,
  TravellerAirlinePrefs,
} from '@/lib/firebase/customers/travellerAirlinePrefsTypes';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

export async function getTravellerAirlinePrefs(
  adminId: string,
  customerId: string,
): Promise<TravellerAirlinePrefs | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  return withFirestoreRetry('getTravellerAirlinePrefs', async () => {
    const profile = await loadCustomerProfile(aid, cid);
    return mapTravellerAirlinePrefs(cid, profile);
  });
}

export async function getTravellerAirlinePrefsSafe(
  adminId: string,
  customerId: string,
): Promise<GetTravellerAirlinePrefsResult> {
  try {
    const airlinePrefs = await getTravellerAirlinePrefs(adminId, customerId);
    return { airlinePrefs, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load airline preferences';
    console.error('[getTravellerAirlinePrefs]', error);
    return { airlinePrefs: null, errorMessage: message };
  }
}

/** Client → travellers → each profile’s airline prefs. */
export async function getClientTravellersAirlinePrefs(
  adminId: string,
  clientId: string,
): Promise<TravellerAirlinePrefs[]> {
  const travellers = await getTravellersForClient(adminId, clientId);
  return Promise.all(travellers.map((t) => getTravellerAirlinePrefs(adminId, t.customerId))).then(
    (rows) => rows.filter((r): r is TravellerAirlinePrefs => r != null),
  );
}
