/**
 * Profile hub — fetch layer.
 *
 *   Screen (Trips/Testing-style ids)
 *     → getClientProfileSafe(adminId, clientId)
 *     → getDoc(admins/{adminId}/clients/{clientId})
 *     → mapClientDocToProfileView
 *     → sync activeClientProfile (name/email for Home header)
 *
 * Mapping rules live in `mapClientProfile.ts` (pure). Types in `clientProfileTypes.ts`.
 */

import { collection, doc, getCountFromServer, getDoc } from 'firebase/firestore';

import type { GetClientProfileResult } from '@/lib/firebase/clients/clientProfileTypes';
import { mapClientDocToProfileView } from '@/lib/firebase/clients/mapClientProfile';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';
import { setActiveClientProfile } from '@/lib/session/activeClientProfile';

export type {
  ClientProfileView,
  GetClientProfileResult,
} from '@/lib/firebase/clients/clientProfileTypes';
export {
  familyLabelFromClientName,
  mapClientDocToProfileView,
} from '@/lib/firebase/clients/mapClientProfile';

async function countClientTravellers(adminId: string, clientId: string): Promise<number | null> {
  try {
    const nested = collection(db, 'admins', adminId, 'clients', clientId, 'customers');
    const nestedCount = await getCountFromServer(nested);
    const n = nestedCount.data().count;
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Load CRM client for Profile. Requires scoped adminId + clientId
 * (same pair Trips / Testing resolve from active profile + test fallback).
 */
export async function getClientProfile(adminId: string, clientId: string) {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    return null;
  }

  return withFirestoreRetry('getClientProfile', async () => {
    const ref = doc(db, 'admins', aid, 'clients', cid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }

    const travellerCount = await countClientTravellers(aid, cid);
    const view = mapClientDocToProfileView(snap.data(), {
      adminId: aid,
      clientId: cid,
      documentPath: ref.path,
      travellerCount,
    });

    await setActiveClientProfile({
      clientId: cid,
      adminId: aid,
      name: view.displayName,
      contactEmail: view.contactEmail ?? '',
    });

    return view;
  });
}

/** UI-safe wrapper — never throws; returns errorMessage for empty / failed reads. */
export async function getClientProfileSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientProfileResult> {
  try {
    const profile = await getClientProfile(adminId, clientId);
    return {
      profile,
      errorMessage: profile ? null : 'Client not found',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load client profile';
    console.error('[getClientProfile]', error);
    return { profile: null, errorMessage: message };
  }
}
