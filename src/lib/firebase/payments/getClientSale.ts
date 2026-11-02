/**
 * One Instant Sale for payments enrichment.
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 */

import { doc, getDoc, type DocumentData } from 'firebase/firestore';

import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

export async function getClientSale(
  adminId: string,
  clientId: string,
  saleId: string,
): Promise<DocumentData | null> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) {
    throw new PaymentsScopeError();
  }

  return withFirestoreRetry('getClientSale', async () => {
    const ref = doc(db, 'admins', aid, 'clients', cid, 'sales', sid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as DocumentData;
  });
}
