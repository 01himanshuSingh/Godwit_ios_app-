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
  type DocumentReference,
  type QuerySnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';

export type CustomerProfileSnapshot = {
  data: DocumentData;
  ref: DocumentReference;
};

function firstDoc(snap: QuerySnapshot): CustomerProfileSnapshot | null {
  if (snap.empty) return null;
  const d = snap.docs[0];
  if (!d) return null;
  return { data: d.data(), ref: d.ref };
}

/**
 * Resolve profile data + DocumentReference (needed for preference writes).
 */
export async function loadCustomerProfileSnapshot(
  adminId: string,
  customerId: string,
): Promise<CustomerProfileSnapshot | null> {
  const aid = adminId.trim();
  const cid = customerId.trim();
  if (!aid || !cid) return null;

  const nested = await getDocs(collection(db, 'admins', aid, 'customers', cid, 'customerProfile'));
  const fromNested = firstDoc(nested);
  if (fromNested) return fromNested;

  try {
    const byGroup = await getDocs(
      query(collectionGroup(db, 'customerProfile'), where('customerId', '==', cid), limit(1)),
    );
    const fromGroup = firstDoc(byGroup);
    if (fromGroup) return fromGroup;
  } catch (error) {
    console.warn('[loadCustomerProfileSnapshot] collectionGroup failed:', error);
  }

  const legacyRef = doc(db, 'admins', aid, 'customerProfile', cid);
  const legacy = await getDoc(legacyRef);
  if (legacy.exists()) {
    return { data: legacy.data(), ref: legacyRef };
  }

  return null;
}

export async function loadCustomerProfile(
  adminId: string,
  customerId: string,
): Promise<DocumentData | null> {
  const snap = await loadCustomerProfileSnapshot(adminId, customerId);
  return snap?.data ?? null;
}
