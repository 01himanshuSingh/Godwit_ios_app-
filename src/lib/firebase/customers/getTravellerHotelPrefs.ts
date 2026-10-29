/**
 * Hotel prefs for one traveller (and batch helper for a client).
 *
 * Client → linked travellers → each traveller’s customerProfile.preferences
 *   roomType ✅ | preferredHotelBrands ❌ (null until CRM)
 */

import { doc, getDoc } from 'firebase/firestore';

import { getTravellersForClient } from '@/lib/firebase/customers/getTravellersForClient';
import { loadCustomerProfile } from '@/lib/firebase/customers/loadCustomerProfile';
import { mapTravellerHotelPrefs } from '@/lib/firebase/customers/mapTravellerHotelPrefs';
import type {
  GetTravellerHotelPrefsResult,
  TravellerHotelPrefs,
} from '@/lib/firebase/customers/travellerHotelPrefsTypes';
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

export async function getTravellerHotelPrefs(
  adminId: string,
  customerId: string,
  travellerName?: string | null,
): Promise<TravellerHotelPrefs | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  return withFirestoreRetry('getTravellerHotelPrefs', async () => {
    const [profileData, nameFromDoc] = await Promise.all([
      loadCustomerProfile(aid, cid),
      travellerName != null && String(travellerName).trim()
        ? Promise.resolve(String(travellerName).trim())
        : loadTravellerName(aid, cid),
    ]);

    return mapTravellerHotelPrefs(cid, profileData, nameFromDoc);
  });
}

export async function getTravellerHotelPrefsSafe(
  adminId: string,
  customerId: string,
  travellerName?: string | null,
): Promise<GetTravellerHotelPrefsResult> {
  try {
    const hotelPrefs = await getTravellerHotelPrefs(adminId, customerId, travellerName);
    return { hotelPrefs, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load hotel preferences';
    console.error('[getTravellerHotelPrefs]', error);
    return { hotelPrefs: null, errorMessage: message };
  }
}

/** Client → travellers → each profile’s hotel prefs (batch). */
export async function getClientTravellersHotelPrefs(
  adminId: string,
  clientId: string,
): Promise<TravellerHotelPrefs[]> {
  const travellers = await getTravellersForClient(adminId, clientId);
  return Promise.all(
    travellers.map(async (t) => {
      const profile = await loadCustomerProfile(adminId, t.customerId);
      return mapTravellerHotelPrefs(t.customerId, profile, t.name || null);
    }),
  );
}
