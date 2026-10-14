/**
 * Extract hotel Instant Sale confirmation fields for Active Trip detail.
 *
 * Source (same sale doc — no separate confirmation collection):
 *   Path: `admins/{adminId}/clients/{clientId}/sales/{saleId}`
 *
 * CRM Instant Sale stores:
 *   - confirmationNo  → top-level sale (walkIn / form fallbacks)
 *   - addressOfHotel  → service form / walkIn / bookModel
 *   - mealPlan        → service form / walkIn
 *
 * System design (same pattern as extractHotelGodwitBenefits):
 *   getDoc(sales/{saleId}) once in getActiveTripDetail
 *     → mapHotelDetail uses extractHotelSaleConfirmationDetails(saleData) // sync
 *     → (hotel) preferredPartnership getDoc + extractGodwitBenefits…
 *     → ActiveTripDetailScreen
 *
 * Prefer the sync extract with the sale doc already loaded.
 */
import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore';

import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/activeTripDetailTypes';
import { db as defaultDb } from '@/lib/firebase/firestore';

export type HotelConfirmationFieldSource =
  'saleTopLevel' | 'walkInModel' | 'bookModel' | 'serviceForm' | 'serviceDirect' | 'none';

export type ExtractedHotelConfirmationDetails = {
  confirmationNo: string | null;
  confirmationBadge: string | null;
  confirmationSource: HotelConfirmationFieldSource;
  address: string | null;
  addressSource: HotelConfirmationFieldSource;
  mealPlan: string | null;
  mealPlanSource: HotelConfirmationFieldSource;
};

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function readFieldValue(field: DocumentData | undefined): string | null {
  if (!field) {
    return null;
  }
  return (
    readString(field.value) ?? readString(field.dateValue) ?? readString(field.textValue) ?? null
  );
}

function findServiceFormField(
  service: DocumentData | null | undefined,
  fieldKey: string,
): string | null {
  if (!service) {
    return null;
  }
  const sections =
    (service.additionalFields as unknown[]) || (service.additionalProperties as unknown[]) || [];
  if (!Array.isArray(sections)) {
    return null;
  }

  for (const section of sections) {
    const sec = asRecord(section);
    const fields = Array.isArray(sec?.fields) ? sec.fields : [];
    for (const field of fields) {
      const f = asRecord(field);
      if (f && String(f.fieldKey || '') === fieldKey) {
        const v = readFieldValue(f);
        if (v) {
          return v;
        }
      }
    }
  }
  return null;
}

type ResolvedField = {
  value: string | null;
  source: HotelConfirmationFieldSource;
};

/**
 * Resolve one hotel confirmation UI field.
 * Order: service form → walkIn → bookModel → top-level → service direct.
 */
function resolveHotelSaleField(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  book: DocumentData | null,
  keys: string[],
): ResolvedField {
  for (const key of keys) {
    const fromForm = findServiceFormField(service, key);
    if (fromForm) {
      return { value: fromForm, source: 'serviceForm' };
    }
    const fromWalkIn = readString(walkIn[key]);
    if (fromWalkIn) {
      return { value: fromWalkIn, source: 'walkInModel' };
    }
    const fromBook = book ? readString(book[key]) : null;
    if (fromBook) {
      return { value: fromBook, source: 'bookModel' };
    }
    const fromTop = readString(data[key]);
    if (fromTop) {
      return { value: fromTop, source: 'saleTopLevel' };
    }
    if (service) {
      const direct = readString(service[key]);
      if (direct) {
        return { value: direct, source: 'serviceDirect' };
      }
    }
  }
  return { value: null, source: 'none' };
}

function confirmationBadge(confirmationNo: string | null): string | null {
  if (!confirmationNo) {
    return null;
  }
  const n = confirmationNo.trim();
  if (/^confirmation\b/i.test(n)) {
    return n;
  }
  return `Confirmation ${n}`;
}

/**
 * Core extract — pass the Instant Sale doc already loaded in getActiveTripDetail.
 * No Firestore calls.
 */
export function extractHotelSaleConfirmationDetails(
  saleData: DocumentData,
): ExtractedHotelConfirmationDetails {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const book = asRecord(saleData.bookModel);
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;

  const confirmation = resolveHotelSaleField(saleData, walkIn, service, book, [
    'confirmationNo',
    'bookingReference',
    'pnr',
    'hotelConfirmationNo',
  ]);
  const topConfirmation = readString(saleData.confirmationNo);
  const confirmationNo = topConfirmation ?? confirmation.value;
  const confirmationSource: HotelConfirmationFieldSource = topConfirmation
    ? 'saleTopLevel'
    : confirmation.source;

  const address = resolveHotelSaleField(saleData, walkIn, service, book, [
    'addressOfHotel',
    'hotelAddress',
    'address',
  ]);

  const mealPlan = resolveHotelSaleField(saleData, walkIn, service, book, [
    'mealPlan',
    'boardBasis',
  ]);

  return {
    confirmationNo,
    confirmationBadge: confirmationBadge(confirmationNo),
    confirmationSource,
    address: address.value,
    addressSource: address.source,
    mealPlan: mealPlan.value,
    mealPlanSource: mealPlan.source,
  };
}

function upsertDetailRow(
  rows: DetailRow[],
  label: string,
  value: string | null,
  kind: DetailRow['kind'] = 'text',
): DetailRow[] {
  const next = rows.filter((r) => r.label !== label);
  const v = value?.trim();
  if (!v) {
    return next;
  }
  // ROOM always before CHECK-IN / CHECK-OUT.
  const order = [
    'ROOM',
    'CHECK-IN',
    'CHECK-OUT',
    'NIGHTS',
    'MEAL PLAN',
    'ADDRESS',
    'TELEPHONE',
    'TRAVELLERS',
  ];
  const row: DetailRow = { label, value: v, kind };
  const withRow = [...next, row];
  withRow.sort((a, b) => {
    const ai = order.indexOf(a.label);
    const bi = order.indexOf(b.label);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return withRow;
}

/**
 * Merge confirmation extract into mapped hotel detail (badges + DETAILS rows).
 * Sync — call after mapHotelDetail with the same saleData.
 */
export function applyHotelConfirmationToDetail(
  detail: ActiveTripDetailBase,
  saleData: DocumentData,
): ActiveTripDetailBase {
  const conf = extractHotelSaleConfirmationDetails(saleData);
  let rows = detail.detailRows;
  rows = upsertDetailRow(rows, 'MEAL PLAN', conf.mealPlan ?? null);
  rows = upsertDetailRow(rows, 'ADDRESS', conf.address ?? null);

  const confirmationNo = conf.confirmationNo ?? detail.confirmationNo;
  const confirmationBadge = conf.confirmationBadge ?? detail.confirmationBadge;

  const missing = detail.missingForMockup.filter(
    (k) =>
      !(k === 'confirmationNo' && confirmationNo) &&
      !(k === 'mealPlan' && conf.mealPlan) &&
      !(k === 'addressOfHotel' && conf.address),
  );

  return {
    ...detail,
    confirmationNo,
    confirmationBadge,
    detailRows: rows,
    missingForMockup: missing,
  };
}

/**
 * Standalone fetch — prefer extractHotelSaleConfirmationDetails(saleData)
 * after the shared sale getDoc in getActiveTripDetail.
 */
export async function fetchHotelSaleConfirmationDetails(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<ExtractedHotelConfirmationDetails> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) {
    throw new Error('adminId, clientId and saleId are required');
  }

  const saleRef = doc(firestore, 'admins', aid, 'clients', cid, 'sales', sid);
  const saleSnap = await getDoc(saleRef);
  if (!saleSnap.exists()) {
    return {
      confirmationNo: null,
      confirmationBadge: null,
      confirmationSource: 'none',
      address: null,
      addressSource: 'none',
      mealPlan: null,
      mealPlanSource: 'none',
    };
  }

  return extractHotelSaleConfirmationDetails(saleSnap.data());
}

export async function fetchHotelSaleConfirmationDetailsSafe(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<ExtractedHotelConfirmationDetails & { errorMessage: string | null }> {
  try {
    const result = await fetchHotelSaleConfirmationDetails(adminId, clientId, saleId, firestore);
    return { ...result, errorMessage: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load hotel confirmation details';
    console.error('[fetchHotelSaleConfirmationDetails]', error);
    return {
      confirmationNo: null,
      confirmationBadge: null,
      confirmationSource: 'none',
      address: null,
      addressSource: 'none',
      mealPlan: null,
      mealPlanSource: 'none',
      errorMessage: message,
    };
  }
}
