/**
 * Client Instant Sale bookings → upcoming trips.
 *
 * Collection: `sales`
 * Path:       `admins/{adminId}/clients/{clientId}/sales/{saleId}`
 *
 * Path-only reads + cursor pagination (no collectionGroup indexes).
 */
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';
import { mapYachtUpcomingCardFields } from '@/lib/firebase/sales/yachtServices';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';

export const SALES_PAGE_SIZE = 40;

export type TripBucket = 'upcoming' | 'current' | 'past' | 'unknown';

export type SaleServiceType =
  | 'hotel'
  | 'hotelRoomExtension'
  | 'air'
  | 'airExtras'
  | 'airReissue'
  | 'privateJet'
  | 'yacht'
  | 'chauffeur'
  | 'vip'
  | 'visa'
  | 'experiences'
  | 'other';

export type ClientSaleTraveller = {
  id: string;
  name: string;
  role?: string;
};

export type ClientSaleTrip = {
  saleId: string;
  adminId: string;
  clientId: string;
  documentPath: string;
  travelDateKey: string | null;
  travelDateRaw: string | null;
  endDateKey: string | null;
  destinationCity: string | null;
  bucket: TripBucket;
  saleStatus: boolean;
  serviceType: SaleServiceType;
  serviceTypeLabel: string;
  serviceKind: string | null;
  serviceName: string | null;
  hotelBrand: string | null;
  confirmationNo: string | null;
  clientName: string | null;
  travellers: ClientSaleTraveller[];
  serviceModelList: DocumentData[];
  walkInModel: DocumentData;
  /** Display time HH:mm (hotel defaults to 15:00 check-in when CRM has none). */
  displayTime: string | null;
  /** Subtitle under the service title (route, city · room, etc.). */
  detailLine: string | null;
  /** Card title — hotel property name, flight label, etc. */
  displayTitle: string;
  /** "Confirmed" | "Cancelled" | null for UI status line. */
  statusLabel: 'Confirmed' | 'Cancelled' | null;
  raw: DocumentData;
};

export type SalesPageCursor = QueryDocumentSnapshot<DocumentData> | null;

export type ClientSalesPage = {
  trips: ClientSaleTrip[];
  /** Opaque cursor for the next page (null when exhausted). */
  nextCursor: SalesPageCursor;
  hasMore: boolean;
};

export type GetClientUpcomingSalesResult = {
  trips: ClientSaleTrip[];
  errorMessage: string | null;
};

export type UpcomingTripsCardSummary = {
  hasUpcoming: boolean;
  startDate: string | null;
  endDate: string | null;
  travellerCount: number;
  servicesCount: number;
  destinationLabel: string | null;
  summaryLine: string | null;
  nextTrip: ClientSaleTrip | null;
  upcomingTrips: ClientSaleTrip[];
};

export type GetUpcomingTripsCardResult = {
  card: UpcomingTripsCardSummary;
  errorMessage: string | null;
};

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const t = value.trim();
  return t.length ? t : null;
}

function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayLocalKey(): string {
  return formatLocalDateKey(new Date());
}

function toDateKey(value: unknown): string | null {
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return s;
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return formatLocalDateKey(d);
    }
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateKey(value);
  }
  if (value && typeof value === 'object') {
    if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
      try {
        return formatLocalDateKey((value as { toDate: () => Date }).toDate());
      } catch {
        /* fall through */
      }
    }
    const sec =
      (value as { seconds?: unknown }).seconds ?? (value as { _seconds?: unknown })._seconds;
    if (typeof sec === 'number' && Number.isFinite(sec)) {
      return formatLocalDateKey(new Date(sec * 1000));
    }
  }
  return null;
}

function bucketForDateKey(travelDateKey: string | null): TripBucket {
  if (!travelDateKey) {
    return 'unknown';
  }
  const today = todayLocalKey();
  if (travelDateKey > today) {
    return 'upcoming';
  }
  if (travelDateKey === today) {
    return 'current';
  }
  return 'past';
}

function isActiveSale(data: DocumentData): boolean {
  return data.saleStatus !== false && data.status !== false;
}

function mapTravellers(data: DocumentData): ClientSaleTraveller[] {
  if (Array.isArray(data.travellers) && data.travellers.length) {
    return data.travellers
      .map((t: DocumentData) => ({
        id: String(t?.id ?? '').trim(),
        name: String(t?.name ?? '').trim(),
        role: t?.role != null ? String(t.role) : undefined,
      }))
      .filter((t) => t.id || t.name);
  }

  const walkIn = asRecord(data.walkInModel);
  const ids = Array.isArray(walkIn?.guestNameList) ? walkIn.guestNameList : [];
  const names = Array.isArray(walkIn?.guestNames) ? walkIn.guestNames : [];
  const max = Math.max(ids.length, names.length);
  const out: ClientSaleTraveller[] = [];
  for (let i = 0; i < max; i += 1) {
    out.push({
      id: String(ids[i] ?? '').trim(),
      name: String(names[i] ?? '').trim(),
      role: i === 0 ? 'primary' : 'guest',
    });
  }
  return out.filter((t) => t.id || t.name);
}

const KNOWN_SERVICE_TYPES: ReadonlySet<string> = new Set([
  'hotel',
  'hotelRoomExtension',
  'air',
  'airExtras',
  'airReissue',
  'privateJet',
  'yacht',
  'chauffeur',
  'vip',
  'visa',
  'experiences',
  'other',
]);

function looksLikeYachtSale(
  data: DocumentData,
  service: DocumentData | undefined,
  name: string,
): boolean {
  const kind = String(data.serviceKind || service?.serviceKind || '')
    .trim()
    .toLowerCase();
  // CRM stamps "Yacht" / "yacht" — must match case-insensitively.
  if (kind === 'yacht' || kind.includes('yacht')) {
    return true;
  }
  if (
    name.includes('yacht') ||
    name.includes('yacht charter') ||
    service?.isYacht === true ||
    data.isYacht === true
  ) {
    return true;
  }
  const walkIn = asRecord(data.walkInModel) ?? {};
  // Instant Sale Other often stamps serviceKind "other" but keeps yachtDescription.
  if (readString(walkIn.yachtDescription)) {
    return true;
  }
  const stampedName = String(
    data.hotelAirlines || walkIn.hotelAirlines || data.serviceName || service?.serviceName || '',
  ).toLowerCase();
  if (stampedName.includes('yacht')) {
    return true;
  }
  // Brand / product labels on Instant Sale Yacht form.
  const category = String(walkIn.category || data.category || '').toLowerCase();
  if (category.includes('yacht')) {
    return true;
  }
  return false;
}

export function resolveSaleServiceType(data: DocumentData): SaleServiceType {
  const service = Array.isArray(data.serviceModelList)
    ? (data.serviceModelList[0] as DocumentData | undefined)
    : undefined;
  const name = String(service?.serviceName || data.serviceName || '').toLowerCase();

  // Name / yacht fields win before stamped serviceKind — CRM often stamps Yacht as "other".
  if (looksLikeYachtSale(data, service, name)) {
    return 'yacht';
  }
  // Before generic air — Instant Sale "Private jet" must not fall through as other/FLIGHT.
  if (
    name.includes('private jet') ||
    name.includes('private-jet') ||
    name.includes('privatejet') ||
    service?.isPrivateJet === true
  ) {
    return 'privateJet';
  }

  const stamped = String(data.serviceKind || '')
    .trim()
    .toLowerCase();
  // Never trust stamped "other" — fall through to name heuristics (yacht/private jet/etc.).
  if (KNOWN_SERVICE_TYPES.has(stamped) && stamped !== 'other') {
    return stamped as SaleServiceType;
  }

  if (
    service?.isHotelRoomExtension === true ||
    name.includes('hotel room extension') ||
    name.includes('hotel-room-extension')
  ) {
    return 'hotelRoomExtension';
  }
  if (name.includes('hotel')) {
    return 'hotel';
  }
  if (name.includes('vip') || name.includes('meet and greet')) {
    return 'vip';
  }
  if (name.includes('chauffeur')) {
    return 'chauffeur';
  }
  if (
    service?.isAirReissue === true ||
    name.includes('air reissue') ||
    name.includes('air-reissue')
  ) {
    return 'airReissue';
  }
  if (service?.isAirExtras === true || name.includes('air extras') || name.includes('air-extras')) {
    return 'airExtras';
  }
  if (name.includes('air') || name.includes('flight')) {
    return 'air';
  }
  if (name.includes('visa')) {
    return 'visa';
  }
  if (name.includes('experiences') || name.includes('experience')) {
    return 'experiences';
  }
  if (name.includes('transfer') || name.includes('car')) {
    return 'chauffeur';
  }
  return 'other';
}

export function saleServiceTypeLabel(type: SaleServiceType): string {
  const labels: Record<SaleServiceType, string> = {
    hotel: 'Hotel',
    hotelRoomExtension: 'Hotel room extension',
    air: 'Air',
    airExtras: 'Air extras',
    airReissue: 'Air reissue',
    privateJet: 'Private jet',
    yacht: 'Yacht',
    chauffeur: 'Chauffeur',
    vip: 'Airport VIP',
    visa: 'Visa',
    experiences: 'Experiences',
    other: 'Other',
  };
  return labels[type] ?? 'Other';
}

export function filterTripsByServiceType(
  trips: ClientSaleTrip[],
  type: SaleServiceType | SaleServiceType[],
): ClientSaleTrip[] {
  const set = new Set(Array.isArray(type) ? type : [type]);
  return trips.filter((t) => set.has(t.serviceType));
}

function resolveEndDateKey(
  walkIn: DocumentData,
  data: DocumentData,
  travelDateKey: string | null,
): string | null {
  const book = asRecord(data.bookModel);
  const end =
    toDateKey(walkIn.returnDate) ??
    toDateKey(walkIn.endDate) ??
    toDateKey(book?.endDate) ??
    toDateKey(data.endDate) ??
    null;
  if (!end) {
    return travelDateKey;
  }
  if (travelDateKey && end < travelDateKey) {
    return travelDateKey;
  }
  return end;
}

function parseHm(value: unknown): string | null {
  const s = readString(value);
  if (!s) {
    return null;
  }
  const hm = s.match(/^(\d{1,2}):(\d{2})/);
  if (!hm) {
    return null;
  }
  return `${hm[1].padStart(2, '0')}:${hm[2]}`;
}

/** Hotel Instant Sale: CRM rarely stores check-in clock time → default 15:00. */
const HOTEL_DEFAULT_CHECK_IN = '15:00';

function extractDisplayTime(
  serviceType: SaleServiceType,
  walkIn: DocumentData,
  data: DocumentData,
  travelDateRaw: string | null,
): string | null {
  const candidates = [
    walkIn.checkInTime,
    walkIn.departureTime,
    walkIn.arrivalTime,
    walkIn.pickupTime,
    walkIn.time,
    walkIn.flightTime,
    data.checkInTime,
  ];
  for (const value of candidates) {
    const hm = parseHm(value);
    if (hm) {
      return hm;
    }
  }

  if (travelDateRaw) {
    const iso = travelDateRaw.match(/T(\d{2}):(\d{2})/);
    if (iso) {
      return `${iso[1]}:${iso[2]}`;
    }
    const d = new Date(travelDateRaw);
    if (!Number.isNaN(d.getTime())) {
      const hours = d.getHours();
      const mins = d.getMinutes();
      if (hours !== 0 || mins !== 0) {
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      }
    }
  }

  if (serviceType === 'hotel' || serviceType === 'hotelRoomExtension') {
    return HOTEL_DEFAULT_CHECK_IN;
  }

  return null;
}

function readCustomField(source: DocumentData, keys: string[]): string | null {
  const custom = asRecord(source.customFields) ?? asRecord(source.customField);
  if (custom) {
    for (const key of keys) {
      const hit = readString(custom[key]);
      if (hit) {
        return hit;
      }
    }
  }
  for (const key of keys) {
    const hit = readString(source[key]);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function resolveHotelRoomLine(walkIn: DocumentData, data: DocumentData): string | null {
  const room =
    readString(walkIn.roomType) ??
    readString(walkIn.roomName) ??
    readString(data.roomType) ??
    readCustomField(walkIn, ['roomType', 'roomName', 'Room Type']) ??
    readCustomField(data, ['roomType', 'roomName', 'Room Type']);

  const view =
    readString(walkIn.roomView) ??
    readString(walkIn.view) ??
    readCustomField(walkIn, ['roomView', 'view', 'View', 'courtyard view']) ??
    readCustomField(data, ['roomView', 'view', 'View']);

  if (room && view) {
    // Avoid duplicating view text already embedded in roomType.
    if (room.toLowerCase().includes(view.toLowerCase())) {
      return room;
    }
    return `${room}, ${view}`;
  }
  return room ?? view;
}

/**
 * Hotel title: hotelBrand → customHotelBrand → walkIn.hotelBrand → nameOfHotel.
 */
function resolveHotelTitle(data: DocumentData, walkIn: DocumentData): string | null {
  return (
    readString(data.hotelBrand) ??
    readString(data.customHotelBrand) ??
    readString(walkIn.hotelBrand) ??
    readString(walkIn.customHotelBrand) ??
    readString(data.nameOfHotel) ??
    readString(walkIn.nameOfHotel) ??
    readString(walkIn.hotelAirlines) ??
    readString(data.hotelAirlines)
  );
}

function resolveDisplayTitle(
  serviceType: SaleServiceType,
  data: DocumentData,
  walkIn: DocumentData,
  services: DocumentData[],
  hotelBrand: string | null,
): string {
  if (serviceType === 'hotel' || serviceType === 'hotelRoomExtension') {
    return hotelBrand ?? resolveHotelTitle(data, walkIn) ?? readString(data.serviceName) ?? 'Hotel';
  }

  // Instant Sale Air: selected airline is walkIn.category (e.g. "Emirates" / "EK — Emirates").
  if (serviceType === 'air' || serviceType === 'airExtras' || serviceType === 'airReissue') {
    return (
      readString(walkIn.category) ??
      readString(walkIn.hotelAirlines) ??
      readString(data.hotelAirlines) ??
      readString(data.serviceName) ??
      (services[0] ? readString(services[0].serviceName) : null) ??
      saleServiceTypeLabel(serviceType)
    );
  }

  // Instant Sale Private jet: list title is always the product label (route stays on detailLine).
  if (serviceType === 'privateJet') {
    return 'Private jet';
  }

  // Yacht title is built in mapSaleDoc via mapSaleToYachtCardUI.
  if (serviceType === 'yacht') {
    return (
      readString(data.serviceName) ??
      (services[0] ? readString(services[0].serviceName) : null) ??
      'Yacht'
    );
  }

  return (
    hotelBrand ??
    readString(data.serviceName) ??
    readString(walkIn.hotelAirlines) ??
    (services[0] ? readString(services[0].serviceName) : null) ??
    saleServiceTypeLabel(serviceType)
  );
}

/** Hotel subtitle: "Paris · Deluxe Suite, courtyard view" */
function buildHotelDetailLine(
  destinationCity: string | null,
  walkIn: DocumentData,
  data: DocumentData,
): string | null {
  const roomLine = resolveHotelRoomLine(walkIn, data);
  if (destinationCity && roomLine) {
    return `${destinationCity} · ${roomLine}`;
  }
  return destinationCity ?? roomLine;
}

function buildDetailLine(
  serviceType: SaleServiceType,
  walkIn: DocumentData,
  data: DocumentData,
  destinationCity: string | null,
): string | null {
  if (serviceType === 'hotel' || serviceType === 'hotelRoomExtension') {
    return buildHotelDetailLine(destinationCity, walkIn, data);
  }

  const route = readString(walkIn.route);
  if (route) {
    return route;
  }

  if (
    serviceType === 'air' ||
    serviceType === 'airExtras' ||
    serviceType === 'airReissue' ||
    serviceType === 'privateJet'
  ) {
    return destinationCity;
  }

  if (serviceType === 'vip') {
    return (
      readString(walkIn.notes) ??
      readString(walkIn.serviceType) ??
      (destinationCity ? `Meet & assist, ${destinationCity}` : null)
    );
  }

  if (serviceType === 'chauffeur') {
    return route ?? destinationCity ?? readString(walkIn.serviceType);
  }

  if (serviceType === 'yacht') {
    // Overridden in mapSaleDoc via mapSaleToYachtCardUI.
    return destinationCity;
  }

  return destinationCity;
}

/**
 * Confirmed: active sale; prefer when confirmationNo exists (CRM hotel),
 * otherwise still Confirmed for any non-cancelled sale (list already filters cancelled).
 */
function resolveStatusLabel(
  active: boolean,
  confirmationNo: string | null,
): 'Confirmed' | 'Cancelled' | null {
  if (!active) {
    return 'Cancelled';
  }
  if (confirmationNo) {
    return 'Confirmed';
  }
  return 'Confirmed';
}

function mapSaleDoc(
  docSnap: QueryDocumentSnapshot<DocumentData>,
  adminId: string,
  clientId: string,
): ClientSaleTrip {
  const data = docSnap.data();
  const walkIn = asRecord(data.walkInModel) ?? {};
  const travelDateKey =
    toDateKey(walkIn.travelDateKey) ??
    toDateKey(walkIn.travelDate) ??
    toDateKey(walkIn.serviceDateTime) ??
    toDateKey(data.travelDateKey) ??
    toDateKey(data.travelDate);

  const saleId = String(data.saleId || data.customerVisitId || docSnap.id).trim();
  const services = Array.isArray(data.serviceModelList)
    ? (data.serviceModelList as DocumentData[])
    : [];
  const serviceType = resolveSaleServiceType(data);
  const travelDateRaw =
    readString(walkIn.travelDate) ?? readString(walkIn.serviceDateTime) ?? travelDateKey;
  const destinationCity = readString(walkIn.destinationCity);
  const hotelBrand = resolveHotelTitle(data, walkIn);
  const active = isActiveSale(data);
  const confirmationNo = readString(data.confirmationNo);
  const resolvedAdminId = readString(data.adminId) ?? adminId;
  const resolvedClientId = readString(data.clientId) ?? clientId;

  let displayTitle = resolveDisplayTitle(serviceType, data, walkIn, services, hotelBrand);
  let displayTime = extractDisplayTime(serviceType, walkIn, data, travelDateRaw);
  let detailLine = buildDetailLine(serviceType, walkIn, data, destinationCity);
  let statusLabel = resolveStatusLabel(active, confirmationNo);
  let serviceTypeLabel = saleServiceTypeLabel(serviceType);
  let resolvedServiceType = serviceType;

  /**
   * Yacht Upcoming card (UpcomingTripRow):
   *   YACHT     ← serviceType === 'yacht' → serviceTypeListLabel → "YACHT"
   *   Title     ← yacht.title      = walkIn.route + destinationCity → displayTitle
   *   Subtitle  ← yacht.detailLine = walkIn.category + duration    → detailLine
   *   Time      ← yacht.displayTime = travelDate / serviceDateTime → displayTime
   */
  if (serviceType === 'yacht') {
    const yacht = mapYachtUpcomingCardFields(data);
    resolvedServiceType = 'yacht';
    serviceTypeLabel = 'Yacht';
    displayTitle = yacht.title;
    detailLine = yacht.detailLine;
    displayTime = yacht.displayTime;
    statusLabel = yacht.statusLabel;
  }

  return {
    saleId,
    adminId: resolvedAdminId,
    clientId: resolvedClientId,
    documentPath: docSnap.ref.path,
    travelDateKey,
    travelDateRaw,
    endDateKey: resolveEndDateKey(walkIn, data, travelDateKey),
    destinationCity,
    bucket: bucketForDateKey(travelDateKey),
    saleStatus: active,
    serviceType: resolvedServiceType,
    serviceTypeLabel,
    serviceKind: readString(data.serviceKind),
    serviceName:
      readString(data.serviceName) ?? (services[0] ? readString(services[0].serviceName) : null),
    hotelBrand,
    confirmationNo,
    clientName: readString(data.clientName) ?? readString(data.name),
    travellers: mapTravellers(data),
    serviceModelList: services,
    walkInModel: walkIn,
    displayTime,
    detailLine,
    displayTitle,
    statusLabel,
    raw: data,
  };
}

function sortByTravelDateAsc(a: ClientSaleTrip, b: ClientSaleTrip): number {
  const ak = a.travelDateKey ?? '';
  const bk = b.travelDateKey ?? '';
  if (ak !== bk) {
    return ak.localeCompare(bk);
  }
  const at = a.displayTime ?? '';
  const bt = b.displayTime ?? '';
  if (at !== bt) {
    return at.localeCompare(bt);
  }
  return a.saleId.localeCompare(b.saleId);
}

function emptyUpcomingTripsCard(): UpcomingTripsCardSummary {
  return {
    hasUpcoming: false,
    startDate: null,
    endDate: null,
    travellerCount: 0,
    servicesCount: 0,
    destinationLabel: null,
    summaryLine: null,
    nextTrip: null,
    upcomingTrips: [],
  };
}

function buildSummaryLine(next: ClientSaleTrip, servicesCount: number): string {
  const place = next.hotelBrand || next.serviceName || next.destinationCity || 'Upcoming booking';
  if (servicesCount <= 1) {
    return `${place} · ${next.serviceTypeLabel}`;
  }
  return `${place} · ${servicesCount} services arranged`;
}

export function buildUpcomingTripsCardSummary(
  upcomingTrips: ClientSaleTrip[],
): UpcomingTripsCardSummary {
  const trips = [...upcomingTrips].filter((t) => !!t.travelDateKey).sort(sortByTravelDateAsc);

  if (!trips.length) {
    return emptyUpcomingTripsCard();
  }

  const nextTrip = trips[0];
  const startDate = nextTrip.travelDateKey;
  let endDate = trips[0].endDateKey ?? trips[0].travelDateKey;

  for (const t of trips) {
    const candidate = t.endDateKey ?? t.travelDateKey;
    if (candidate && (!endDate || candidate > endDate)) {
      endDate = candidate;
    }
  }

  const travellerIds = new Set<string>();
  for (const t of trips) {
    for (const traveller of t.travellers) {
      const key = traveller.id || traveller.name.toLowerCase();
      if (key) {
        travellerIds.add(key);
      }
    }
  }

  return {
    hasUpcoming: true,
    startDate,
    endDate,
    travellerCount: travellerIds.size,
    servicesCount: trips.length,
    destinationLabel: nextTrip.destinationCity || nextTrip.hotelBrand,
    summaryLine: buildSummaryLine(nextTrip, trips.length),
    nextTrip,
    upcomingTrips: trips,
  };
}

export type TripsListMode = 'upcoming' | 'current' | 'past';

function matchesTripsListMode(
  trip: ClientSaleTrip,
  mode: TripsListMode,
  includeCurrentWithUpcoming: boolean,
): boolean {
  if (mode === 'past') {
    return trip.bucket === 'past';
  }
  if (mode === 'current') {
    return trip.bucket === 'current';
  }
  // upcoming
  if (trip.bucket === 'upcoming') {
    return true;
  }
  if (includeCurrentWithUpcoming && trip.bucket === 'current') {
    return true;
  }
  return false;
}

/**
 * One page of sales docs — cursor pagination on documentId (always indexed).
 * Filter to upcoming in the app layer after mapping.
 */
export async function getClientSalesPage(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
  cursor: SalesPageCursor = null,
  pageSize: number = SALES_PAGE_SIZE,
): Promise<ClientSalesPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new Error('adminId and clientId are required');
  }

  return withFirestoreRetry('getClientSalesPage', async () => {
    const salesRef = collection(db, 'admins', aid, 'clients', cid, 'sales');
    const q = cursor
      ? query(salesRef, orderBy(documentId()), startAfter(cursor), limit(pageSize))
      : query(salesRef, orderBy(documentId()), limit(pageSize));

    const snap = await getDocs(q);
    const trips = snap.docs.map((d) => mapSaleDoc(d, aid, cid));
    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      trips,
      nextCursor: snap.docs.length === pageSize ? last : null,
      hasMore: snap.docs.length === pageSize,
    };
  });
}

/** All Instant Sale docs for a client (paginated under the hood). */
export async function getClientSales(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<ClientSaleTrip[]> {
  const all: ClientSaleTrip[] = [];
  let cursor: SalesPageCursor = null;
  let hasMore = true;

  while (hasMore) {
    const page = await getClientSalesPage(adminId, clientId, cursor);
    all.push(...page.trips);
    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  return all.sort(sortByTravelDateAsc);
}

export async function getClientUpcomingSales(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
  options?: {
    includeCurrent?: boolean;
    includeCancelled?: boolean;
  },
): Promise<ClientSaleTrip[]> {
  const includeCurrent = options?.includeCurrent !== false;
  const includeCancelled = options?.includeCancelled === true;
  const all = await getClientSales(adminId, clientId);

  return all
    .filter((trip) => {
      if (!includeCancelled && !trip.saleStatus) {
        return false;
      }
      return matchesTripsListMode(trip, 'upcoming', includeCurrent);
    })
    .sort(sortByTravelDateAsc);
}

/**
 * Infinite-query page: load the next sales page, return only matching bucket rows
 * from that page (+ cursor). Caller accumulates pages.
 *
 * mode:
 *   upcoming — travelDate > today (and today when includeCurrent)
 *   current  — travelDate === today
 *   past     — travelDate < today  (yacht dated e.g. 18 Sep lands here)
 */
export async function getClientUpcomingSalesPage(
  adminId: string,
  clientId: string,
  cursor: SalesPageCursor = null,
  options?: {
    mode?: TripsListMode;
    includeCurrent?: boolean;
    includeCancelled?: boolean;
    pageSize?: number;
  },
): Promise<{
  upcoming: ClientSaleTrip[];
  nextCursor: SalesPageCursor;
  hasMore: boolean;
}> {
  const mode: TripsListMode = options?.mode ?? 'upcoming';
  const includeCurrent = options?.includeCurrent !== false;
  const includeCancelled = options?.includeCancelled === true;
  const page = await getClientSalesPage(adminId, clientId, cursor, options?.pageSize);

  const upcoming = page.trips
    .filter((trip) => {
      if (!includeCancelled && !trip.saleStatus) {
        return false;
      }
      return matchesTripsListMode(trip, mode, includeCurrent);
    })
    .sort(mode === 'past' ? (a, b) => sortByTravelDateAsc(b, a) : sortByTravelDateAsc);

  return {
    upcoming,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  };
}

export async function getClientUpcomingSalesSafe(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<GetClientUpcomingSalesResult> {
  try {
    const trips = await getClientUpcomingSales(adminId, clientId);
    return { trips, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load upcoming sales';
    console.error('[getClientUpcomingSales]', error);
    return { trips: [], errorMessage: message };
  }
}

export async function getClientUpcomingTripsCard(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<UpcomingTripsCardSummary> {
  const upcoming = await getClientUpcomingSales(adminId, clientId);
  return buildUpcomingTripsCardSummary(upcoming);
}

export async function getClientUpcomingTripsCardSafe(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<GetUpcomingTripsCardResult> {
  try {
    const card = await getClientUpcomingTripsCard(adminId, clientId);
    return { card, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load upcoming trips card';
    console.error('[getClientUpcomingTripsCard]', error);
    return { card: emptyUpcomingTripsCard(), errorMessage: message };
  }
}

export function sortClientSaleTripsAsc(trips: ClientSaleTrip[]): ClientSaleTrip[] {
  return [...trips].sort(sortByTravelDateAsc);
}
