import { collection, getDocs, limit, query } from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

import type { ServiceMapEntry } from './serviceMap';

export type ResolvedBranchAndService = {
  branchId: string;
  serviceId: string;
  serviceName: string;
};

/**
 * Soft lookups — never block the client if branch/services catalogs fail.
 * Fallback: branch "default", SERVICE_MAP.fallback name, empty serviceId.
 */
export async function resolveBranchAndService(
  adminId: string,
  map: ServiceMapEntry,
): Promise<ResolvedBranchAndService> {
  let branchId = 'default';
  let serviceId = '';
  let serviceName = map.fallback;

  try {
    const branchSnap = await withFirestoreRetry('enquiries.resolveBranch', async () =>
      getDocs(query(collection(db, 'admins', adminId, 'branch'), limit(1))),
    );
    if (!branchSnap.empty) {
      branchId = branchSnap.docs[0]!.id;
    }
  } catch (error) {
    console.warn('[enquiries] branch lookup failed — using default:', error);
  }

  try {
    const servicesSnap = await withFirestoreRetry('enquiries.resolveService', async () =>
      getDocs(collection(db, 'admins', adminId, 'services')),
    );
    const keyword = map.keyword.toLowerCase();
    const match = servicesSnap.docs
      .map((d) => d.data())
      .find((s) => {
        if (s?.status === false) return false;
        const name = String(s?.serviceName || '').toLowerCase();
        return name.includes(keyword);
      });

    if (match) {
      serviceId = String(match.serviceId || match.id || '').trim();
      serviceName = String(match.serviceName || map.fallback).trim() || map.fallback;
    }
  } catch (error) {
    console.warn('[enquiries] services lookup failed — using fallback name:', error);
  }

  return { branchId, serviceId, serviceName };
}
