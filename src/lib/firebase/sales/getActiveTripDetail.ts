/**
 * Active trip / booking detail — one Instant Sale doc.
 * Path: `admins/{adminId}/clients/{clientId}/sales/{saleId}`
 *
 * Fetch once here; service-specific shaping lives in `mappers/`.
 */
import { doc, getDoc, type DocumentData } from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import type {
  ActiveTripDetailBase,
  DetailRow,
  GetActiveTripDetailResult,
  GodwitBenefit,
} from '@/lib/firebase/sales/activeTripDetailTypes';
import {
  resolveSaleServiceType,
  saleServiceTypeLabel,
  type SaleServiceType,
} from '@/lib/firebase/sales/getClientUpcomingSales';
import { mapAirDetail } from '@/lib/firebase/sales/airServices';
import {
  applyHotelCancellationTermsToDetail,
  applyHotelConfirmationToDetail,
  loadPreferredPartnership,
  mapHotelDetail,
  readPreferredPartnershipId,
} from '@/lib/firebase/sales/hotelServices';
import { mapVipDetail } from '@/lib/firebase/sales/vipServices';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

export type {
  ActiveTripDetailBase,
  DetailRow,
  GetActiveTripDetailResult,
  GodwitBenefit,
} from '@/lib/firebase/sales/activeTripDetailTypes';

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

function pickField(
  walkIn: DocumentData,
  service: DocumentData | null,
  data: DocumentData,
  keys: string[],
): string | null {
  for (const key of keys) {
    const fromWalkIn = readString(walkIn[key]);
    if (fromWalkIn) {
      return fromWalkIn;
    }
    const fromTop = readString(data[key]);
    if (fromTop) {
      return fromTop;
    }
    const fromService = findServiceFormField(service, key);
    if (fromService) {
      return fromService;
    }
    if (service) {
      const direct = readString(service[key]);
      if (direct) {
        return direct;
      }
    }
  }
  return null;
}

function travellerNamesFromSale(data: DocumentData): string[] {
  if (Array.isArray(data.travellers) && data.travellers.length) {
    return data.travellers.map((t: DocumentData) => String(t?.name || '').trim()).filter(Boolean);
  }
  const walkIn = asRecord(data.walkInModel) ?? {};
  if (Array.isArray(walkIn.guestNames)) {
    return walkIn.guestNames.map((n) => String(n || '').trim()).filter(Boolean);
  }
  return [];
}

function statusLabelFromSale(data: DocumentData): string {
  if (data.saleStatus === false || data.status === false) {
    return 'Cancelled';
  }
  return 'Confirmed';
}

function paymentLabelFromSale(data: DocumentData): string | null {
  const deposit = asRecord(data.depositModel);
  if (!deposit) {
    return null;
  }
  const balance = Number(deposit.balanceAmount);
  if (Number.isFinite(balance) && balance <= 0) {
    return 'Paid in full';
  }
  const initial = Number(deposit.initialAmount);
  if (Number.isFinite(initial) && initial > 0) {
    return 'Deposit paid';
  }
  return null;
}

function pushRow(
  rows: DetailRow[],
  label: string,
  value: string | null | undefined,
  kind: DetailRow['kind'] = 'text',
) {
  const v = value?.trim();
  if (v) {
    rows.push({ label, value: v, kind });
  }
}

function formatRouteArrow(route: string | null): string | null {
  if (!route) {
    return null;
  }
  return route
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s*->\s*/g, ' → ')
    .replace(/\s+to\s+/gi, ' → ')
    .trim();
}

/** Short label for chauffeur subtitle (e.g. CDG, Mandarin Oriental). */
function shortenPlaceLabel(place: string | null): string | null {
  if (!place) {
    return null;
  }
  const code = place.match(/\(([A-Z]{3})\)/);
  if (code) {
    return code[1];
  }
  // "Charles de Gaulle, Terminal 2C" → keep airport-ish head before terminal
  const beforeTerminal = place.split(/,\s*Terminal/i)[0]?.trim();
  if (beforeTerminal && beforeTerminal.length <= 28) {
    return beforeTerminal;
  }
  // Hotel name often before first comma / address number
  const head = place.split(',')[0]?.trim();
  return head && head.length > 0 ? head : place;
}

function extractClockTime(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const hm = value.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hm) {
    return `${hm[1].padStart(2, '0')}:${hm[2]}`;
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const h = d.getHours();
    const m = d.getMinutes();
    if (h !== 0 || m !== 0 || /T\d{2}:\d{2}/.test(value)) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return null;
}

/**
 * Chauffeur Instant Sale detail — matches Active Trip chauffeur mock:
 * title, route subtitle, VEHICLE / PICK-UP / DROP-OFF / ON THE DAY / TRAVELLERS.
 */
function mapChauffeurDetail(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  base: Omit<ActiveTripDetailBase, 'title' | 'subtitle' | 'detailRows' | 'missingForMockup'>,
): ActiveTripDetailBase {
  const vehicleBase = pickField(walkIn, service, data, [
    'chauffeurVehicleDescription',
    'vehicleType',
    'vehicle',
    'carType',
    'description',
  ]);
  const language = pickField(walkIn, service, data, [
    'chauffeurLanguage',
    'driverLanguage',
    'language',
  ]);
  let vehicle = vehicleBase || 'Chauffeur';
  if (language && !vehicle.toLowerCase().includes(language.toLowerCase())) {
    const langBit = /speaking/i.test(language) ? language : `${language}-speaking chauffeur`;
    vehicle = `${vehicle}, ${langBit}`;
  }

  // Prefer discrete pickup location vs datetime fields.
  const pickupPlace = pickField(walkIn, service, data, [
    'departurePoint',
    'pickupLocation',
    'pickUpLocation',
    'from',
  ]);
  const dropoffPlace = pickField(walkIn, service, data, [
    'arrivalPoint',
    'dropoffLocation',
    'dropOffLocation',
    'dropOffPoint',
    'to',
  ]);
  const dropoffAddress = pickField(walkIn, service, data, [
    'dropOffAddress',
    'arrivalAddress',
    'address',
  ]);

  const pickUpWhen = pickField(walkIn, service, data, [
    'pickUpDateTime',
    'pickupTime',
    'departureTime',
    'travelDate',
  ]);
  const pickupTime =
    extractClockTime(pickUpWhen) ?? pickField(walkIn, service, data, ['pickupTime', 'time']);

  // If departurePoint also holds datetime, split: place from dedicated field only.
  let pickupLocation = pickupPlace;
  if (!pickupLocation && pickUpWhen && !extractClockTime(pickUpWhen)) {
    pickupLocation = pickUpWhen;
  }
  // Terminal often stored separately on Instant Sale chauffeur forms.
  const pickupTerminal = pickField(walkIn, service, data, [
    'terminal',
    'departureTerminal',
    'pickupTerminal',
  ]);
  const pickupWithTerminal = [
    pickupLocation,
    pickupTerminal
      ? pickupTerminal.startsWith('Terminal')
        ? pickupTerminal
        : `Terminal ${pickupTerminal}`
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  const pickupLine = [pickupWithTerminal || pickupLocation, pickupTime].filter(Boolean).join(' · ');

  const dropoffLine = [dropoffPlace, dropoffAddress].filter(Boolean).join(', ') || dropoffPlace;

  const onTheDay = pickField(walkIn, service, data, [
    'remarks',
    'specialRequests',
    'internalNotes',
    'chauffeurNotes',
    'onTheDay',
    'meetingInstructions',
    'godwitBenefits',
  ]);

  const routeField = formatRouteArrow(pickField(walkIn, service, data, ['route']));
  const subtitle =
    routeField ||
    [shortenPlaceLabel(pickupLocation || pickupWithTerminal), shortenPlaceLabel(dropoffPlace)]
      .filter(Boolean)
      .join(' → ') ||
    null;

  const rows: DetailRow[] = [];
  pushRow(rows, 'VEHICLE', vehicle);
  pushRow(rows, 'PICK-UP', pickupLine || pickupLocation);
  pushRow(rows, 'DROP-OFF', dropoffLine);
  pushRow(rows, 'ON THE DAY', onTheDay);
  pushRow(rows, 'TRAVELLERS', base.travellerNames.length ? base.travellerNames.join(', ') : null);

  return {
    ...base,
    title: 'Chauffeur',
    subtitle,
    serviceTypeLabel: 'Chauffeur',
    inclusionBadge: base.inclusionBadge ?? 'Included in your trip',
    detailRows: rows,
    missingForMockup: [],
  };
}

function mapGenericDetail(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  base: Omit<ActiveTripDetailBase, 'title' | 'subtitle' | 'detailRows' | 'missingForMockup'>,
  type: SaleServiceType,
): ActiveTripDetailBase {
  const name =
    readString(data.serviceName) ||
    pickField(walkIn, service, data, ['description']) ||
    saleServiceTypeLabel(type);

  const rows: DetailRow[] = [];
  pushRow(rows, 'SERVICE', name);
  pushRow(
    rows,
    'DATE',
    pickField(walkIn, service, data, ['travelDate', 'startDate', 'serviceDateTime']),
  );
  pushRow(
    rows,
    'DESTINATION',
    pickField(walkIn, service, data, ['destinationCity', 'cityName', 'route']),
  );
  pushRow(rows, 'TRAVELLERS', base.travellerNames.length ? base.travellerNames.join(', ') : null);

  return {
    ...base,
    title: name,
    subtitle: pickField(walkIn, service, data, ['destinationCity', 'route']),
    detailRows: rows,
    missingForMockup: [],
  };
}

export function mapSaleDocToActiveTripDetail(
  data: DocumentData,
  opts: {
    adminId: string;
    clientId: string;
    saleId: string;
    documentPath: string;
    /** Preferred Partnership catalog — hotel benefits only. */
    partnershipData?: DocumentData | null;
  },
): ActiveTripDetailBase {
  const walkIn = asRecord(data.walkInModel) ?? {};
  const service = Array.isArray(data.serviceModelList) ? asRecord(data.serviceModelList[0]) : null;

  const serviceType = resolveSaleServiceType(data);
  const confirmationNo = readString(data.confirmationNo);
  const base = {
    saleId: opts.saleId,
    adminId: opts.adminId,
    clientId: opts.clientId,
    documentPath: opts.documentPath,
    serviceType,
    serviceTypeLabel: saleServiceTypeLabel(serviceType),
    statusLabel: statusLabelFromSale(data),
    confirmationNo,
    confirmationBadge: confirmationNo ? `Confirmation ${confirmationNo}` : null,
    paymentLabel: paymentLabelFromSale(data),
    inclusionBadge: null as string | null,
    travellerNames: travellerNamesFromSale(data),
    specialRequests: [] as string[],
    cancellationTerms: null as string | null,
    godwitBenefits: [] as GodwitBenefit[],
    showMessageGodwitCta: true,
    raw: data,
  };

  if (serviceType === 'hotel' || serviceType === 'hotelRoomExtension') {
    return mapHotelDetail(data, walkIn, service, base, opts.partnershipData ?? null);
  }
  if (serviceType === 'air' || serviceType === 'airExtras' || serviceType === 'airReissue') {
    return mapAirDetail(data, walkIn, service, base);
  }
  if (serviceType === 'chauffeur') {
    return mapChauffeurDetail(data, walkIn, service, base);
  }
  if (serviceType === 'vip') {
    return mapVipDetail(data, walkIn, service, base);
  }
  return mapGenericDetail(data, walkIn, service, base, serviceType);
}

export async function getClientSaleActiveTripDetail(
  adminId: string,
  clientId: string,
  saleId: string,
): Promise<ActiveTripDetailBase | null> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) {
    throw new Error('adminId, clientId and saleId are required');
  }

  return withFirestoreRetry('getClientSaleActiveTripDetail', async () => {
    const ref = doc(db, 'admins', aid, 'clients', cid, 'sales', sid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }

    const saleData = snap.data();
    const serviceType = resolveSaleServiceType(saleData);
    let partnershipData: DocumentData | null = null;

    // Hotel: partnership catalog for benefits (sale only stores preferredPartnershipId).
    if (serviceType === 'hotel' || serviceType === 'hotelRoomExtension') {
      const partnershipId = readPreferredPartnershipId(saleData);
      if (partnershipId) {
        partnershipData = await loadPreferredPartnership(aid, partnershipId);
      }
    }

    let detail = mapSaleDocToActiveTripDetail(saleData, {
      adminId: aid,
      clientId: cid,
      saleId: sid,
      documentPath: snap.ref.path,
      partnershipData,
    });

    // Hotel confirmation / address / mealPlan — sync extract on same sale (no 2nd fetch).
    if (detail.serviceType === 'hotel' || detail.serviceType === 'hotelRoomExtension') {
      detail = applyHotelConfirmationToDetail(detail, saleData);
    }

    // Cancellation terms (walkIn) — any service; sync; card hides when null.
    detail = applyHotelCancellationTermsToDetail(detail, saleData);

    return detail;
  });
}

export async function getClientSaleActiveTripDetailSafe(
  adminId: string,
  clientId: string,
  saleId: string,
): Promise<GetActiveTripDetailResult> {
  try {
    const detail = await getClientSaleActiveTripDetail(adminId, clientId, saleId);
    return { detail, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load sale detail';
    console.error('[getClientSaleActiveTripDetail]', error);
    return { detail: null, errorMessage: message };
  }
}
