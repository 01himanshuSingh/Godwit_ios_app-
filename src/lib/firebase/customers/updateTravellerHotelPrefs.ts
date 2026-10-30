/**
 * Write traveller hotel preference fields on customerProfile.preferences.
 *
 * Path resolve (same as reads):
 *   nested customers/{id}/customerProfile → collectionGroup → legacy
 *
 * Fields:
 *   preferredHotelBrands → preferences.preferredHotelBrands
 *   preferredRoomType    → preferences.roomType
 */

import { doc, setDoc, updateDoc } from 'firebase/firestore';

import { loadCustomerProfileSnapshot } from '@/lib/firebase/customers/loadCustomerProfile';
import type { TravellerHotelPrefField } from '@/lib/firebase/customers/travellerHotelPrefsTypes';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

const PREF_PATH: Record<TravellerHotelPrefField, string> = {
  preferredHotelBrands: 'preferences.preferredHotelBrands',
  preferredRoomType: 'preferences.roomType',
};

export type UpdateTravellerHotelPrefsResult = {
  ok: boolean;
  errorMessage: string | null;
};

/**
 * Persist one hotel pref field. Creates a nested profile doc when none exists yet.
 */
export async function updateTravellerHotelPref(
  adminId: string,
  customerId: string,
  field: TravellerHotelPrefField,
  value: string,
): Promise<void> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) {
    throw new Error('adminId and customerId are required');
  }

  const trimmed = value.trim();
  const firestorePath = PREF_PATH[field];

  return withFirestoreRetry('updateTravellerHotelPref', async () => {
    const existing = await loadCustomerProfileSnapshot(aid, cid);

    if (existing) {
      await updateDoc(existing.ref, { [firestorePath]: trimmed });
      return;
    }

    // No profile yet — create nested CRM doc under the customer.
    const ref = doc(db, 'admins', aid, 'customers', cid, 'customerProfile', cid);
    await setDoc(
      ref,
      {
        customerId: cid,
        preferences: {
          preferredHotelBrands: field === 'preferredHotelBrands' ? trimmed : null,
          roomType: field === 'preferredRoomType' ? trimmed : null,
        },
      },
      { merge: true },
    );
  });
}

export async function updateTravellerHotelPrefSafe(
  adminId: string,
  customerId: string,
  field: TravellerHotelPrefField,
  value: string,
): Promise<UpdateTravellerHotelPrefsResult> {
  try {
    await updateTravellerHotelPref(adminId, customerId, field, value);
    return { ok: true, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update hotel preference';
    console.error('[updateTravellerHotelPref]', error);
    return { ok: false, errorMessage: message };
  }
}
