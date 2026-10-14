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
import {
  applyHotelCancellationTermsToDetail,
  applyHotelConfirmationToDetail,
  loadPreferredPartnership,
  mapHotelDetail,
  readPreferredPartnershipId,
} from '@/lib/firebase/sales/hotelServices';
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

/** Format VIP / service datetime for DETAILS → TIME. */
function formatDisplayDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(
    value.includes('T') || value.includes(' ') ? value : `${value}T12:00:00`,
  );
  if (Number.isNaN(parsed)) {
    return value;
  }
  const d = new Date(parsed);
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hours = d.getHours();
  const mins = d.getMinutes();
  if (hours === 0 && mins === 0 && !/T\d{2}:\d{2}/.test(value) && !/\d{1,2}:\d{2}/.test(value)) {
    return datePart;
  }
  const timePart = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  return `${datePart}, ${timePart}`;
}

/** CRM inclusions often arrive as commas / newlines → "A · B · C". */
function formatInclusionsLine(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const parts = raw
    .split(/[\n;|]+|\s*[·•]\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return raw.trim();
  }
  return parts.join(' · ');
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

function parseAirportCity(leg: DocumentData | null, fallbackCity: string | null): string | null {
  if (!leg) {
    return fallbackCity;
  }
  const city = readString(leg.city) ?? readString(leg.airportCity) ?? fallbackCity;
  const code = readString(leg.airportCode) ?? readString(leg.code) ?? readString(leg.iata);
  if (city && code) {
    return `${city} (${code})`;
  }
  return city ?? code;
}

function formatLegLine(
  place: string | null,
  time: string | null,
  terminal: string | null,
): string | null {
  const parts: string[] = [];
  if (place) {
    parts.push(place);
  }
  if (time) {
    parts.push(time);
  }
  if (terminal) {
    parts.push(terminal.startsWith('Terminal') ? terminal : `Terminal ${terminal}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

function mapAirDetail(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  base: Omit<ActiveTripDetailBase, 'title' | 'subtitle' | 'detailRows' | 'missingForMockup'>,
): ActiveTripDetailBase {
  const route = formatRouteArrow(pickField(walkIn, service, data, ['route']));
  const cabin = pickField(walkIn, service, data, ['cabinClass', 'cabin']);
  const travelDate = pickField(walkIn, service, data, ['travelDate', 'travelDateKey']);
  const returnDate = pickField(walkIn, service, data, ['returnDate']);
  const flightType = pickField(walkIn, service, data, ['flightType']);
  const ticket = pickField(walkIn, service, data, ['ticketNumber']);
  const seats = pickField(walkIn, service, data, ['seats', 'seatNumbers', 'seat']);
  const baggage = pickField(walkIn, service, data, ['baggage', 'baggageAllowance']);
  const flightNo = pickField(walkIn, service, data, ['flightNumber', 'flightNo', 'flight']);
  const airline =
    pickField(walkIn, service, data, ['hotelAirlines', 'airline', 'carrier']) ||
    readString(data.serviceName) ||
    'Flight';

  const airLegs = Array.isArray(walkIn.airLegs) ? walkIn.airLegs : [];
  const firstLeg = asRecord(airLegs[0]);
  const lastLeg = asRecord(airLegs[airLegs.length - 1]) ?? firstLeg;

  const departPlace =
    parseAirportCity(firstLeg, null) ??
    pickField(walkIn, service, data, ['departureAirport', 'from']);
  const arrivePlace =
    parseAirportCity(lastLeg, null) ?? pickField(walkIn, service, data, ['arrivalAirport', 'to']);

  const departTime =
    readString(firstLeg?.departureTime) ?? pickField(walkIn, service, data, ['departureTime']);
  const arriveTime =
    readString(lastLeg?.arrivalTime) ?? pickField(walkIn, service, data, ['arrivalTime']);

  const departTerminal =
    readString(firstLeg?.departureTerminal) ??
    readString(firstLeg?.terminal) ??
    pickField(walkIn, service, data, ['departureTerminal']);
  const arriveTerminal =
    readString(lastLeg?.arrivalTerminal) ?? pickField(walkIn, service, data, ['arrivalTerminal']);

  const departs =
    formatLegLine(departPlace, departTime, departTerminal) ??
    ([travelDate, departTime].filter(Boolean).join(' · ') || travelDate);
  const arrives =
    formatLegLine(arrivePlace, arriveTime, arriveTerminal) ??
    ([returnDate, arriveTime].filter(Boolean).join(' · ') || returnDate);

  const resolvedFlightNo =
    flightNo ?? readString(firstLeg?.flightNumber) ?? readString(firstLeg?.flightNo);

  const title =
    resolvedFlightNo && airline && !airline.toLowerCase().includes(resolvedFlightNo.toLowerCase())
      ? `${airline} ${resolvedFlightNo}`
      : resolvedFlightNo
        ? `${airline} ${resolvedFlightNo}`.trim()
        : airline;

  const subtitle = route ?? ([departPlace, arrivePlace].filter(Boolean).join(' → ') || null);

  const rows: DetailRow[] = [];
  pushRow(rows, 'CARRIER', airline);
  pushRow(rows, 'FLIGHT', resolvedFlightNo);
  pushRow(rows, 'ROUTE', route);
  pushRow(rows, 'FLIGHT TYPE', flightType);
  pushRow(rows, 'DEPARTS', departs);
  pushRow(rows, 'ARRIVES', arrives);
  pushRow(rows, 'RETURNS', returnDate && !arrives ? returnDate : null);
  pushRow(rows, 'CABIN', cabin);
  pushRow(rows, 'SEATS', seats);
  pushRow(rows, 'BAGGAGE', baggage);
  pushRow(rows, 'TICKET', ticket);
  pushRow(rows, 'BOOKING REF', base.confirmationNo);
  pushRow(rows, 'TRAVELLERS', base.travellerNames.length ? base.travellerNames.join(', ') : null);

  const missingForMockup: string[] = [];
  if (!resolvedFlightNo) {
    missingForMockup.push('flight number');
  }
  if (!seats) {
    missingForMockup.push('seats');
  }
  if (!baggage) {
    missingForMockup.push('baggage');
  }
  if (!departTerminal && !arriveTerminal) {
    missingForMockup.push('terminals');
  }

  return {
    ...base,
    title,
    subtitle,
    detailRows: rows,
    missingForMockup,
  };
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

function mapVipDetail(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  base: Omit<ActiveTripDetailBase, 'title' | 'subtitle' | 'detailRows' | 'missingForMockup'>,
): ActiveTripDetailBase {
  const description =
    pickField(walkIn, service, data, ['vipServiceDescription', 'serviceType', 'description']) ||
    'Meet & assist';

  const airportName = pickField(walkIn, service, data, [
    'airportName',
    'airport',
    'cityName',
    'destinationCity',
  ]);
  const terminal = pickField(walkIn, service, data, [
    'terminal',
    'arrivalTerminal',
    'departureTerminal',
  ]);
  const airportLine = [
    airportName,
    terminal ? (terminal.startsWith('Terminal') ? terminal : `Terminal ${terminal}`) : null,
  ]
    .filter(Boolean)
    .join(', ');

  const whenRaw = pickField(walkIn, service, data, [
    'serviceDateTime',
    'travelDate',
    'pickUpDateTime',
    'travelDateKey',
  ]);
  const timeOnly = pickField(walkIn, service, data, ['arrivalTime', 'departureTime', 'time']);
  let when = formatDisplayDateTime(whenRaw);
  if (when && timeOnly && !when.includes(':')) {
    when = `${when}, ${timeOnly}`;
  } else if (!when && timeOnly) {
    when = timeOnly;
  }

  const inclusions = formatInclusionsLine(
    pickField(walkIn, service, data, [
      'godwitBenefits',
      'inclusions',
      'included',
      'remarks',
      'specialRequests',
    ]),
  );

  const rows: DetailRow[] = [];
  pushRow(rows, 'AIRPORT', airportLine || airportName);
  pushRow(rows, 'SERVICE', description);
  pushRow(rows, 'TIME', when);
  pushRow(rows, 'INCLUDED', inclusions);
  pushRow(rows, 'TRAVELLERS', base.travellerNames.length ? base.travellerNames.join(', ') : null);

  return {
    ...base,
    title: 'Airport VIP',
    subtitle: description,
    serviceTypeLabel: 'Airport VIP',
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
