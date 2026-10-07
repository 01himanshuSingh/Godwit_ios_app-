import {
  collection,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';

/** CRM: visitType 0 = sale / booking; Instant Sale v1 often omits the field entirely. */
const VISIT_TYPE_SALE = 0;

export type ClientTripSummary = {
  id: string;
  source: 'sales' | 'customerServices';
  documentPath: string;
  travelDate: string | null;
  travelDateKey: string | null;
  /** CRM `date` on sales docs — used for sort when travel dates missing. */
  createdDate: string | null;
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
  const endMs = startMs + dayMs;

  if (now < startMs) {
    return 'upcoming';
  }
  if (now >= startMs && now < endMs) {
    return 'current';
  }
  return 'past';
}

function firstTravellerId(data: DocumentData): string | null {
  const travellers = data.travellers;
  if (!Array.isArray(travellers) || travellers.length === 0) {
    return null;
  }
  const first = travellers[0];
  if (typeof first === 'string') {
    return readOptionalString(first);
  }
  if (first && typeof first === 'object') {
    const row = first as Record<string, unknown>;
    return readOptionalString(row.id) ?? readOptionalString(row.customerId);
  }
  return null;
}

function isSaleOrUnspecifiedVisit(data: DocumentData): boolean {
  return data.visitType === VISIT_TYPE_SALE || data.visitType === undefined;
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
    createdDate: firestoreDateToIso(data.date),
    clientName: readOptionalString(data.clientName),
    hotelBrand: readOptionalString(data.hotelBrand),
    saleStatus: typeof data.saleStatus === 'boolean' ? data.saleStatus : null,
    customerId:
      readOptionalString(data.customerId) ??
      firstTravellerId(data) ??
      (source === 'customerServices' ? (docSnap.ref.parent.parent?.id ?? null) : null),
    bucket: bucketForTravelDate(travelDate, travelDateKey),
  };
}

/**
 * Instant sales — same as CRM client profile: load whole `sales` collection,
 * then keep sale/booking docs in memory (missing visitType is Instant Sale v1).
 */
export async function getClientInstantSales(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<ClientTripSummary[]> {
  const ref = collection(db, 'admins', adminId, 'clients', clientId, 'sales');
  const snap = await getDocs(ref);

  return snap.docs
    .filter((d) => isSaleOrUnspecifiedVisit(d.data()))
    .map((d) => mapVisitDoc(d, 'sales'));
}

/**
 * Travellers for this client — `admins/{adminId}/customers` filtered in memory.
 */
export async function getTravellerIdsForClient(
  adminId: string,
  clientId: string,
): Promise<string[]> {
  const customersRef = collection(db, 'admins', adminId, 'customers');
  const snap = await getDocs(customersRef);
  const ids = new Set<string>();

  for (const customerDoc of snap.docs) {
    const data = customerDoc.data();
    if (data.clientId === clientId) {
      ids.add(customerDoc.id);
      continue;
    }
    if (Array.isArray(data.clientIds) && data.clientIds.includes(clientId)) {
      ids.add(customerDoc.id);
    }
  }

  return [...ids];
}

/**
 * Legacy visits — path reads only (no collectionGroup indexes).
 */
export async function getClientCustomerServicesViaTravellers(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<ClientTripSummary[]> {
  const travellerIds = await getTravellerIdsForClient(adminId, clientId);
  const trips: ClientTripSummary[] = [];

  for (const customerId of travellerIds) {
    const servicesRef = collection(
      db,
      'admins',
      adminId,
      'customers',
      customerId,
      'customerServices',
    );
    const snap = await getDocs(servicesRef);

    for (const serviceDoc of snap.docs) {
      const data = serviceDoc.data();
      const clientOk = !data.clientId || data.clientId === clientId;
      if (isSaleOrUnspecifiedVisit(data) && clientOk) {
        trips.push(mapVisitDoc(serviceDoc, 'customerServices'));
      }
    }
  }

  return trips;
}

function sortTripsNewestFirst(trips: ClientTripSummary[]): ClientTripSummary[] {
  return [...trips].sort((a, b) => {
    const aMs =
      travelDateMs(a.travelDate) ??
      travelDateMs(a.travelDateKey) ??
      travelDateMs(a.createdDate) ??
      0;
    const bMs =
      travelDateMs(b.travelDate) ??
      travelDateMs(b.travelDateKey) ??
      travelDateMs(b.createdDate) ??
      0;
    return bMs - aMs;
  });
}

/**
 * Merge instant sales + traveller customerServices; dedupe by visit id (sales wins).
 */
export async function getClientTrips(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<{
  trips: ClientTripSummary[];
  salesError: string | null;
  servicesError: string | null;
}> {
  console.log('[testing] getClientTrips v3 sales-all + travellers', { adminId, clientId });

  let sales: ClientTripSummary[] = [];
  let services: ClientTripSummary[] = [];
  let salesError: string | null = null;
  let servicesError: string | null = null;

  try {
    sales = await getClientInstantSales(adminId, clientId);
    console.log('[testing] sales bookings:', sales.length);
  } catch (error) {
    salesError = error instanceof Error ? error.message : 'Failed to load sales';
    console.error('[testing] getClientInstantSales failed:', error);
  }

  try {
    services = await getClientCustomerServicesViaTravellers(adminId, clientId);
    console.log('[testing] traveller customerServices:', services.length);
  } catch (error) {
    servicesError =
      error instanceof Error ? error.message : 'Failed to load traveller customerServices';
    console.warn('[testing] getClientCustomerServicesViaTravellers failed:', error);
  }

  const byId = new Map<string, ClientTripSummary>();
  for (const trip of services) {
    byId.set(trip.id, trip);
  }
  for (const trip of sales) {
    byId.set(trip.id, trip);
  }

  return {
    trips: sortTripsNewestFirst([...byId.values()]),
    salesError,
    servicesError,
  };
}
