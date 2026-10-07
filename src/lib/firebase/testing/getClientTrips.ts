import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';

/** CRM: visitType 0 = sale / booking. */
const VISIT_TYPE_SALE = 0;

export type ClientTripSummary = {
  id: string;
  source: 'sales' | 'customerServices';
  documentPath: string;
  travelDate: string | null;
  travelDateKey: string | null;
  clientName: string | null;
  hotelBrand: string | null;
  saleStatus: boolean | null;
  customerId: string | null;
  bucket: 'upcoming' | 'current' | 'past' | 'unknown';
};

function readOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function firestoreDateToIso(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function travelDateMs(isoOrKey: string | null): number | null {
  if (!isoOrKey) {
    return null;
  }
  const parsed = Date.parse(isoOrKey);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  // travelDateKey often YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrKey)) {
    return Date.parse(`${isoOrKey}T00:00:00.000Z`);
  }
  return null;
}

function bucketForTravelDate(
  travelDate: string | null,
  travelDateKey: string | null,
): ClientTripSummary['bucket'] {
  const startMs = travelDateMs(travelDate) ?? travelDateMs(travelDateKey);
  if (startMs === null) {
    return 'unknown';
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const endMs = startMs + dayMs; // no end date on many visits — treat travel day as current window

  if (now < startMs) {
    return 'upcoming';
  }
  if (now >= startMs && now < endMs) {
    return 'current';
  }
  return 'past';
}

function mapVisitDoc(
  docSnap: QueryDocumentSnapshot<DocumentData>,
  source: ClientTripSummary['source'],
): ClientTripSummary {
  const data = docSnap.data();
  const walkIn = asRecord(data.walkInModel);
  const travelDate = firestoreDateToIso(walkIn?.travelDate) ?? firestoreDateToIso(data.travelDate);
  const travelDateKey =
    readOptionalString(walkIn?.travelDateKey) ?? readOptionalString(data.travelDateKey);

  return {
    id: docSnap.id,
    source,
    documentPath: docSnap.ref.path,
    travelDate,
    travelDateKey,
    clientName: readOptionalString(data.clientName),
    hotelBrand: readOptionalString(data.hotelBrand),
    saleStatus: typeof data.saleStatus === 'boolean' ? data.saleStatus : null,
    customerId: readOptionalString(data.customerId),
    bucket: bucketForTravelDate(travelDate, travelDateKey),
  };
}

/** Instant sales under `admins/{adminId}/clients/{clientId}/sales`. */
export async function getClientInstantSales(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<ClientTripSummary[]> {
  const ref = collection(db, 'admins', adminId, 'clients', clientId, 'sales');

  try {
    const q = query(ref, where('visitType', '==', VISIT_TYPE_SALE));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapVisitDoc(d, 'sales'));
  } catch (error) {
    console.warn('[testing] sales filtered query failed, reading collection:', error);
    const snap = await getDocs(ref);
    return snap.docs
      .filter((d) => d.data().visitType === VISIT_TYPE_SALE || d.data().visitType === undefined)
      .map((d) => mapVisitDoc(d, 'sales'));
  }
}

/** Bookings via collection group `customerServices` for this admin + client. */
export async function getClientCustomerServices(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<ClientTripSummary[]> {
  try {
    const q = query(
      collectionGroup(db, 'customerServices'),
      where('adminId', '==', adminId),
      where('clientId', '==', clientId),
      where('visitType', '==', VISIT_TYPE_SALE),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapVisitDoc(d, 'customerServices'));
  } catch (error) {
    console.warn('[testing] customerServices composite query failed:', error);
    // Fallback: clientId only (may need index or return broader set).
    const q = query(collectionGroup(db, 'customerServices'), where('clientId', '==', clientId));
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => {
        const data = d.data();
        const adminOk = !data.adminId || data.adminId === adminId;
        const typeOk = data.visitType === VISIT_TYPE_SALE || data.visitType === undefined;
        return adminOk && typeOk;
      })
      .map((d) => mapVisitDoc(d, 'customerServices'));
  }
}

function sortTripsNewestFirst(trips: ClientTripSummary[]): ClientTripSummary[] {
  return [...trips].sort((a, b) => {
    const aMs = travelDateMs(a.travelDate) ?? travelDateMs(a.travelDateKey) ?? 0;
    const bMs = travelDateMs(b.travelDate) ?? travelDateMs(b.travelDateKey) ?? 0;
    return bMs - aMs;
  });
}

/**
 * Merge sales + customerServices; dedupe by customerVisitId (doc id).
 * Prefer `sales` when the same id appears in both.
 */
export async function getClientTrips(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<{
  trips: ClientTripSummary[];
  salesError: string | null;
  servicesError: string | null;
}> {
  let sales: ClientTripSummary[] = [];
  let services: ClientTripSummary[] = [];
  let salesError: string | null = null;
  let servicesError: string | null = null;

  try {
    sales = await getClientInstantSales(adminId, clientId);
  } catch (error) {
    salesError = error instanceof Error ? error.message : 'Failed to load sales';
    console.error('[testing] getClientInstantSales failed:', error);
  }

  try {
    services = await getClientCustomerServices(adminId, clientId);
  } catch (error) {
    servicesError = error instanceof Error ? error.message : 'Failed to load customerServices';
    console.error('[testing] getClientCustomerServices failed:', error);
  }

  const byId = new Map<string, ClientTripSummary>();
  for (const trip of services) {
    byId.set(trip.id, trip);
  }
  for (const trip of sales) {
    byId.set(trip.id, trip); // sales wins on duplicate visit id
  }

  return {
    trips: sortTripsNewestFirst([...byId.values()]),
    salesError,
    servicesError,
  };
}
