/**
 * Travellers for a client account.
 *
 * Path: admins/{adminId}/customers
 * Link: clientIds array-contains clientId  OR  clientId == clientId
 */

import { collection, getDocs, query, where } from 'firebase/firestore';

import type {
  ClientTraveller,
  GetTravellersForClientResult,
} from '@/lib/firebase/customers/travellerTypes';
import { mapCustomerDocToTraveller } from '@/lib/firebase/customers/mapCustomerToTraveller';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

export async function getTravellersForClient(
  adminId: string,
  clientId: string,
): Promise<ClientTraveller[]> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    return [];
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
    const message = error instanceof Error ? error.message : 'Failed to load travellers';
    console.error('[getTravellersForClient]', error);
    return { travellers: [], errorMessage: message };
  }
}
