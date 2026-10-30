/**
 * Write traveller commercial airline preference fields on customerProfile.preferences.
 *
 * Path resolve (same as reads):
 *   nested customers/{id}/customerProfile → collectionGroup → legacy
 *
 * Fields:
 *   preferredAirlines      → preferences.preferredAirlines
 *   specialMeal            → preferences.mealRequests
 *   seatPreference         → preferences.preferredSeating
 *   airportVipRequirement  → preferences.vipServices
 */

import { doc, setDoc, updateDoc } from 'firebase/firestore';

import { loadCustomerProfileSnapshot } from '@/lib/firebase/customers/loadCustomerProfile';
import type { TravellerAirlinePrefField } from '@/lib/firebase/customers/travellerAirlinePrefsTypes';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

const PREF_PATH: Record<TravellerAirlinePrefField, string> = {
  preferredAirlines: 'preferences.preferredAirlines',
  specialMeal: 'preferences.mealRequests',
  seatPreference: 'preferences.preferredSeating',
  airportVipRequirement: 'preferences.vipServices',
};

export type UpdateTravellerAirlinePrefsResult = {
  ok: boolean;
  errorMessage: string | null;
};

/**
 * Persist one airline pref field. Creates a nested profile doc when none exists yet.
 */
export async function updateTravellerAirlinePref(
  adminId: string,
  customerId: string,
  field: TravellerAirlinePrefField,
  value: string,
): Promise<void> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) {
    throw new Error('adminId and customerId are required');
  }

  const trimmed = value.trim();
  const firestorePath = PREF_PATH[field];

  return withFirestoreRetry('updateTravellerAirlinePref', async () => {
    const existing = await loadCustomerProfileSnapshot(aid, cid);

    if (existing) {
      await updateDoc(existing.ref, { [firestorePath]: trimmed });
      return;
    }

    const ref = doc(db, 'admins', aid, 'customers', cid, 'customerProfile', cid);
    await setDoc(
      ref,
      {
        customerId: cid,
        preferences: {
          preferredAirlines: field === 'preferredAirlines' ? trimmed : null,
          mealRequests: field === 'specialMeal' ? trimmed : null,
          preferredSeating: field === 'seatPreference' ? trimmed : null,
          vipServices: field === 'airportVipRequirement' ? trimmed : null,
        },
      },
      { merge: true },
    );
  });
}

export async function updateTravellerAirlinePrefSafe(
  adminId: string,
  customerId: string,
  field: TravellerAirlinePrefField,
  value: string,
): Promise<UpdateTravellerAirlinePrefsResult> {
  try {
    await updateTravellerAirlinePref(adminId, customerId, field, value);
    return { ok: true, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update airline preference';
    console.error('[updateTravellerAirlinePref]', error);
    return { ok: false, errorMessage: message };
  }
}
