/**
 * Shared CRM customerProfile loader (loyalty, hotels, prefs).
 *
 * Order (matches CRM):
 *   1) admins/{adminId}/customers/{customerId}/customerProfile → first doc
 *   2) collectionGroup('customerProfile').where('customerId' == customerId)
 *   3) legacy getDoc admins/{adminId}/customerProfile/{customerId}
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';

function firstDocData(snap: QuerySnapshot): DocumentData | null {
  if (snap.empty) return null;
  return snap.docs[0]?.data() ?? null;
}

export async function loadCustomerProfile(
  adminId: string,
  customerId: string,
): Promise<DocumentData | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  const nested = await getDocs(collection(db, 'admins', aid, 'customers', cid, 'customerProfile'));
  const fromNested = firstDocData(nested);
  if (fromNested) return fromNested;

  try {
    const byGroup = await getDocs(
      query(collectionGroup(db, 'customerProfile'), where('customerId', '==', cid), limit(1)),
    );
    const fromGroup = firstDocData(byGroup);
    if (fromGroup) return fromGroup;
  } catch (error) {
    console.warn('[loadCustomerProfile] collectionGroup failed:', error);
  }

  const legacy = await getDoc(doc(db, 'admins', aid, 'customerProfile', cid));
  if (legacy.exists()) {
    return legacy.data();
  }

  return null;
}
