/**
 * Travellers for a client account.
 *
 * Path: admins/{adminId}/customers
 * Link: clientIds array-contains clientId  OR  clientId == clientId
 *
 * Empty list = no travellers linked (success, not an error).
 * Missing scope / permission / offline → Safe wrapper returns errorMessage.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';

import { mapTravellersLoadErrorToMessage } from '@/lib/firebase/customers/mapTravellersLoadError';
import type {
  ClientTraveller,
  GetTravellersForClientResult,
} from '@/lib/firebase/customers/travellerTypes';
import { mapCustomerDocToTraveller } from '@/lib/firebase/customers/mapCustomerToTraveller';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

class TravellersScopeError extends Error {
  readonly code = 'missing_scope';

  constructor() {
    super('Missing adminId or clientId');
    this.name = 'TravellersScopeError';
  }
}

export async function getTravellersForClient(
  adminId: string,
  clientId: string,
): Promise<ClientTraveller[]> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new TravellersScopeError();
  }

  return withFirestoreRetry('getTravellersForClient', async () => {
    const customersRef = collection(db, 'admins', aid, 'customers');

    const [byArray, byLegacy] = await Promise.all([
      getDocs(query(customersRef, where('clientIds', 'array-contains', cid))),
      getDocs(query(customersRef, where('clientId', '==', cid))),
    ]);

    const byId = new Map<string, ClientTraveller>();

    for (const d of [...byArray.docs, ...byLegacy.docs]) {
      byId.set(d.id, mapCustomerDocToTraveller(d.id, d.data()));
    }

    // Empty array is a valid outcome — client has no linked travellers yet.
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function getTravellersForClientSafe(
  adminId: string,
  clientId: string,
): Promise<GetTravellersForClientResult> {
  try {
    const travellers = await getTravellersForClient(adminId, clientId);
    return { travellers, errorMessage: null };
  } catch (error) {
    const message = mapTravellersLoadErrorToMessage(error);
    console.error('[getTravellersForClient]', error);
    return { travellers: [], errorMessage: message };
  }
}
