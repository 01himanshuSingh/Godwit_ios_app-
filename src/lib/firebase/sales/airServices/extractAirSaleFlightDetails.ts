/**
 * Map Instant Sale AIR → Active Trip DETAILS (flight mock).
 *
 * UI mock rows:
 *   CARRIER / FLIGHT / DEPARTS / ARRIVES / CABIN / SEATS / BAGGAGE / TRAVELLERS
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * System design:
 *   getDoc(sales/{saleId}) once → mapAirDetail / extractAirSaleFlightDetails(saleData)
 */

import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore';

import type { DetailRow } from '@/lib/firebase/sales/activeTripDetailTypes';
import { db as defaultDb } from '@/lib/firebase/firestore';

export type ExtractedAirSaleFlightDetails = {
  title: string;
  subtitle: string | null;
  carrier: string | null;
  flightNumber: string | null;
  route: string | null;
  departs: string | null;
  arrives: string | null;
  cabin: string | null;
  seats: string | null;
  baggage: string | null;
  travellers: string | null;
  bookingRef: string | null;
  ticketNumber: string | null;
  detailRows: DetailRow[];
  missingForMock: string[];
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

function coerceDateLike(value: unknown): string | null {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (value && typeof value === 'object') {
    const withToDate = value as { toDate?: () => Date };
    if (typeof withToDate.toDate === 'function') {
      try {
        const d = withToDate.toDate();
        if (!Number.isNaN(d.getTime())) {
          return d.toISOString();
        }
      } catch {
        /* fall through */
      }
    }
    const sec =
      (value as { seconds?: unknown }).seconds ?? (value as { _seconds?: unknown })._seconds;
    if (typeof sec === 'number' && Number.isFinite(sec)) {
      return new Date(sec * 1000).toISOString();
    }
  }
  return null;
}

function readValue(value: unknown): string | null {
  return readString(value) ?? coerceDateLike(value);
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
        const v = readValue(f.value) ?? readValue(f.dateValue) ?? readValue(f.textValue);
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
    const fromWalkIn = readValue(walkIn[key]);
    if (fromWalkIn) {
      return fromWalkIn;
    }
    const fromTop = readValue(data[key]);
    if (fromTop) {
      return fromTop;
    }
    const fromForm = findServiceFormField(service, key);
    if (fromForm) {
      return fromForm;
    }
    if (service) {
      const direct = readValue(service[key]);
      if (direct) {
        return direct;
      }
    }
  }
  return null;
}

function formatRouteArrow(route: string | null): string | null {
  if (!route) {
    return null;
  }
  return route
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s*->\s*/g, ' → ')
    .replace(/\s+-\s+/g, ' → ')
    .replace(/\s+to\s+/gi, ' → ')
    .trim();
}

/** "DEL - BOM" | "DEL-BOM" | "DEL → BOM" → ends for DEPARTS / ARRIVES place. */
function splitRoute(route: string | null): {
  from: string | null;
  to: string | null;
} {
  if (!route?.trim()) {
    return { from: null, to: null };
  }
  const parts = route
    .split(/\s*→\s*|\s*->\s*|\s*-\s*|\s+to\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    from: parts[0] ?? null,
    to: parts.length > 1 ? parts[parts.length - 1] : null,
  };
}

function formatDate(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return null;
    const parsed = Date.parse(t.includes('T') || t.includes(' ') ? t : `${t}T12:00:00`);
    if (Number.isNaN(parsed)) return t;
    return new Date(parsed).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  const withToDate = value as { toDate?: () => Date };
  if (typeof withToDate.toDate === 'function') {
    try {
      const d = withToDate.toDate();
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      /* fall through */
    }
  }
  const coerced = coerceDateLike(value);
  return coerced ? formatDate(coerced) : null;
}

function parseAirportCity(leg: DocumentData | null, fallback: string | null): string | null {
  if (!leg) {
    return fallback;
  }
  const city = readString(leg.city) ?? readString(leg.airportCity);
  const code = readString(leg.airportCode) ?? readString(leg.code) ?? readString(leg.iata);
  if (city && code) {
    return `${city} (${code})`;
  }
  if (city || code) {
    return city ?? code;
  }
  return fallback;
}

/** "Dubai (DXB) · 08:45 · Terminal 3" — only join pieces that exist. */
function buildLegLine(parts: {
  place?: string | null;
  time?: string | null;
  terminal?: string | null;
}): string | null {
  const bits = [
    parts.place?.trim() || null,
    parts.time?.trim() || null,
    parts.terminal
      ? parts.terminal.startsWith('Terminal')
        ? parts.terminal
        : `Terminal ${parts.terminal}`
      : null,
  ].filter(Boolean) as string[];
  return bits.length ? bits.join(' · ') : null;
}

/**
 * Instant Sale best-effort:
 *   DEPARTS: "DEL · 25 October 2026"  (route from + travelDate)
 *   ARRIVES: "BOM · 25 October 2026"  (route to + returnDate)
 * Richer airLegs (time/terminal) win when present.
 */
function getAirDepartArrive(sale: DocumentData): {
  departs: string | null;
  arrives: string | null;
  departPlace: string | null;
  arrivePlace: string | null;
  departTime: string | null;
  arriveTime: string | null;
  departTerminal: string | null;
  arriveTerminal: string | null;
} {
  const walkIn = asRecord(sale.walkInModel) ?? {};
  const service = Array.isArray(sale.serviceModelList) ? asRecord(sale.serviceModelList[0]) : null;

  const routeRaw = pickField(walkIn, service, sale, ['route']) ?? String(walkIn.route || '');
  const { from, to } = splitRoute(routeRaw);

  const legs = Array.isArray(walkIn.airLegs) ? walkIn.airLegs : [];
  const first = asRecord(legs[0]);
  const last = asRecord(legs[legs.length - 1]) ?? first;

  const departPlace =
    parseAirportCity(first, null) ??
    pickField(walkIn, service, sale, ['departureAirport', 'from']) ??
    from;
  const arrivePlace =
    parseAirportCity(last, null) ??
    pickField(walkIn, service, sale, ['arrivalAirport', 'to']) ??
    to;

  const departTime =
    readString(first?.departureTime) ?? pickField(walkIn, service, sale, ['departureTime']);
  const arriveTime =
    readString(last?.arrivalTime) ?? pickField(walkIn, service, sale, ['arrivalTime']);

  const departTerminal =
    readString(first?.departureTerminal) ??
    readString(first?.terminal) ??
    pickField(walkIn, service, sale, ['departureTerminal']);
  const arriveTerminal =
    readString(last?.arrivalTerminal) ?? pickField(walkIn, service, sale, ['arrivalTerminal']);

  const travelDate =
    walkIn.travelDate ??
    pickField(walkIn, service, sale, ['travelDate', 'travelDateKey', 'departureDate']);
  const returnDate =
    walkIn.returnDate ?? pickField(walkIn, service, sale, ['returnDate', 'arrivalDate']);

  const departDateLabel = formatDate(travelDate);
  const arriveDateLabel = formatDate(returnDate);

  // Rich legs with clock/terminal → mock style; else Instant Sale: "DEL · 25 October 2026".
  const departs =
    departTime || departTerminal
      ? buildLegLine({
          place: departPlace,
          time: departTime,
          terminal: departTerminal,
        })
      : buildLegLine({ place: departPlace, time: departDateLabel }) || departDateLabel;

  const arrives =
    arriveTime || arriveTerminal
      ? buildLegLine({
          place: arrivePlace,
          time: arriveTime,
          terminal: arriveTerminal,
        })
      : buildLegLine({ place: arrivePlace, time: arriveDateLabel }) || arriveDateLabel;

  return {
    departs,
    arrives,
    departPlace,
    arrivePlace,
    departTime,
    arriveTime,
    departTerminal,
    arriveTerminal,
  };
}

function travellerNames(data: DocumentData): string[] {
  if (Array.isArray(data.travellers) && data.travellers.length) {
    return data.travellers.map((t: DocumentData) => String(t?.name || '').trim()).filter(Boolean);
  }
  const walkIn = asRecord(data.walkInModel) ?? {};
  if (Array.isArray(walkIn.guestNames)) {
    return walkIn.guestNames.map((n) => String(n || '').trim()).filter(Boolean);
  }
  return [];
}

function pushRow(rows: DetailRow[], label: string, value: string | null | undefined) {
  const v = value?.trim();
  if (v) {
    rows.push({ label, value: v, kind: 'text' });
  }
}

/**
 * PNR / confirmation — walkIn.bookingReference, else sale.confirmationNo.
 * Shown in DETAILS → FLIGHT on Instant Sale (flight number usually absent).
 */
export function getAirPnr(saleData: DocumentData): string | null {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const fromWalkIn = readString(walkIn.bookingReference) ?? readString(walkIn.pnr);
  if (fromWalkIn) {
    return fromWalkIn;
  }
  return readString(saleData.confirmationNo);
}

/**
 * Core extract — pass Instant Sale doc already loaded in getActiveTripDetail.
 */
export function extractAirSaleFlightDetails(saleData: DocumentData): ExtractedAirSaleFlightDetails {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;

  const carrier =
    pickField(walkIn, service, saleData, ['hotelAirlines', 'airline', 'carrier', 'airlineName']) ||
    readString(saleData.serviceName);

  const route = formatRouteArrow(pickField(walkIn, service, saleData, ['route']));

  const cabin = pickField(walkIn, service, saleData, ['cabinClass', 'cabin', 'class']);

  const flightNumber = pickField(walkIn, service, saleData, ['flightNumber', 'flightNo', 'flight']);

  const seats = pickField(walkIn, service, saleData, [
    'seats',
    'seatNumbers',
    'seat',
    'seatPreference',
  ]);

  const baggage = pickField(walkIn, service, saleData, ['baggage', 'baggageAllowance', 'luggage']);

  const bookingRef =
    getAirPnr(saleData) ??
    pickField(walkIn, service, saleData, ['bookingReference', 'pnr', 'confirmationNo']);

  const ticketNumber = pickField(walkIn, service, saleData, ['ticketNumber']);

  const airLegs = Array.isArray(walkIn.airLegs) ? walkIn.airLegs : [];
  const firstLeg = asRecord(airLegs[0]);

  const { departs, arrives, departPlace, departTime, arriveTime, departTerminal, arriveTerminal } =
    getAirDepartArrive(saleData);

  const resolvedFlightNo =
    flightNumber ?? readString(firstLeg?.flightNumber) ?? readString(firstLeg?.flightNo);

  // DETAILS → FLIGHT: Instant Sale uses PNR; fall back to flight number if present.
  const flightFieldValue = bookingRef ?? resolvedFlightNo;

  const names = travellerNames(saleData);
  const travellers = names.length ? names.join(', ') : null;

  const missingForMock: string[] = [];
  if (!resolvedFlightNo) missingForMock.push('flightNumber');
  if (!bookingRef) missingForMock.push('bookingReference / confirmationNo');
  if (!departTime) missingForMock.push('departureTime');
  if (!arriveTime) missingForMock.push('arrivalTime');
  if (!departTerminal && !arriveTerminal) missingForMock.push('terminals');
  if (!seats) missingForMock.push('seats');
  if (!baggage) missingForMock.push('baggage');
  if (!departPlace?.includes('(')) missingForMock.push('airportCodes');

  const detailRows: DetailRow[] = [];
  pushRow(detailRows, 'CARRIER', carrier);
  pushRow(detailRows, 'FLIGHT', flightFieldValue);
  pushRow(detailRows, 'DEPARTS', departs);
  pushRow(detailRows, 'ARRIVES', arrives);
  pushRow(detailRows, 'CABIN', cabin);
  pushRow(detailRows, 'SEATS', seats);
  pushRow(detailRows, 'BAGGAGE', baggage);
  pushRow(detailRows, 'TRAVELLERS', travellers);

  const title =
    flightFieldValue && carrier ? `${carrier} ${flightFieldValue}` : carrier || 'Flight';

  return {
    title,
    subtitle: route,
    carrier,
    flightNumber: flightFieldValue,
    route,
    departs,
    arrives,
    cabin,
    seats,
    baggage,
    travellers,
    bookingRef,
    ticketNumber,
    detailRows,
    missingForMock,
  };
}

/** Prefer extractAirSaleFlightDetails(saleData) after shared getDoc. */
export async function fetchAirSaleFlightDetails(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<ExtractedAirSaleFlightDetails | null> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) {
    throw new Error('adminId, clientId and saleId are required');
  }
  const ref = doc(firestore, 'admins', aid, 'clients', cid, 'sales', sid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  return extractAirSaleFlightDetails(snap.data());
}
