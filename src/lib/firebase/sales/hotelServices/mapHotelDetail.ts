/**
 * Hotel Instant Sale → Active Trip detail UI model.
 * Mapper only — Firestore fetch stays in getActiveTripDetail.ts.
 *
 * Path (fetched upstream):
 * `admins/{adminId}/clients/{clientId}/sales/{saleId}`
 */
import type { DocumentData } from 'firebase/firestore';

import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/activeTripDetailTypes';
import { extractGodwitBenefitsFromHotelSale } from '@/lib/firebase/sales/hotelServices/extractHotelGodwitBenefits';
import { extractHotelSaleConfirmationDetails } from '@/lib/firebase/sales/hotelServices/extractHotelSaleConfirmationDetails';
import { extractHotelSaleRoomType } from '@/lib/firebase/sales/hotelServices/extractHotelSaleRoomType';

type HotelMapBase = Omit<
  ActiveTripDetailBase,
  'title' | 'subtitle' | 'detailRows' | 'missingForMockup'
>;

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

/**
 * Instant Sale dates are often Firestore Timestamp (or { seconds }), not strings.
 * Upcoming list already handles this; hotel mapper must too or CHECK-IN/OUT stay empty.
 */
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

/** String scalars + Firestore date values used on hotel Instant Sales. */
function readHotelValue(value: unknown): string | null {
  return readString(value) ?? coerceDateLike(value);
}

function readFieldValue(field: DocumentData | undefined): string | null {
  if (!field) {
    return null;
  }
  return (
    readHotelValue(field.value) ??
    readHotelValue(field.dateValue) ??
    readHotelValue(field.textValue) ??
    null
  );
}

/** Hotel Instant Sale form fields live under service additionalFields / additionalProperties. */
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

/**
 * Resolve a hotel UI field (order matches CRM Instant Sale):
 * 1) service form fieldKey
 * 2) walkInModel
 * 3) top-level sale doc
 */
function hotelField(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  keys: string[],
): string | null {
  const book = asRecord(data.bookModel);
  for (const key of keys) {
    const fromForm = findServiceFormField(service, key);
    if (fromForm) {
      return fromForm;
    }
    const fromWalkIn = readHotelValue(walkIn[key]);
    if (fromWalkIn) {
      return fromWalkIn;
    }
    const fromBook = book ? readHotelValue(book[key]) : null;
    if (fromBook) {
      return fromBook;
    }
    const fromTop = readHotelValue(data[key]);
    if (fromTop) {
      return fromTop;
    }
  }
  return null;
}

function splitBullets(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/\r?\n|•|·|;|\|/g)
    .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean);
}

function toDateKey(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Display like "28 October 2026, 15:00" — appends default time if CRM has date only. */
function formatHotelDateTime(raw: string | null, defaultTime: string | null): string | null {
  if (!raw) {
    return null;
  }
  const key = toDateKey(raw);
  if (!key) {
    return raw;
  }

  const hasTime = /\d{1,2}:\d{2}/.test(raw);
  if (hasTime) {
    try {
      const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
    } catch {
      /* fall through */
    }
    return raw;
  }

  const [y, m, day] = key.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return defaultTime ? `${datePart}, ${defaultTime}` : datePart;
}

function nightsBetween(checkInRaw: string | null, checkOutRaw: string | null): string | null {
  const a = toDateKey(checkInRaw);
  const b = toDateKey(checkOutRaw);
  if (!a || !b) {
    return null;
  }
  const start = Date.parse(`${a}T00:00:00`);
  const end = Date.parse(`${b}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null;
  }
  return String(Math.round((end - start) / (24 * 60 * 60 * 1000)));
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

/** Canonical DETAILS order — ROOM always before CHECK-IN / CHECK-OUT. */
const HOTEL_DETAIL_ROW_ORDER = [
  'ROOM',
  'CHECK-IN',
  'CHECK-OUT',
  'NIGHTS',
  'MEAL PLAN',
  'ADDRESS',
  'TELEPHONE',
  'TRAVELLERS',
] as const;

function sortHotelDetailRows(rows: DetailRow[]): DetailRow[] {
  return [...rows].sort((a, b) => {
    const ai = HOTEL_DETAIL_ROW_ORDER.indexOf(a.label as (typeof HOTEL_DETAIL_ROW_ORDER)[number]);
    const bi = HOTEL_DETAIL_ROW_ORDER.indexOf(b.label as (typeof HOTEL_DETAIL_ROW_ORDER)[number]);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

/**
 * Map one Instant Sale doc → hotel Active Trip detail (badges + DETAILS + sections).
 * Pass Preferred Partnership doc when sale has preferredPartnershipId.
 * Empty optional sections stay empty so the UI can hide them.
 */
export function mapHotelDetail(
  data: DocumentData,
  walkIn: DocumentData,
  service: DocumentData | null,
  base: HotelMapBase,
  partnershipData: DocumentData | null = null,
): ActiveTripDetailBase {
  // CRM Instant Sale: selected room(s) on walkIn.route (comma-joined) — sync extract.
  const roomExtract = extractHotelSaleRoomType(data);
  const room = roomExtract.roomType;
  // CRM hotel stays usually store check-in as walkIn.travelDate (Timestamp).
  const checkInRaw = hotelField(data, walkIn, service, [
    'checkInDate',
    'checkIn',
    'travelDate',
    'travelDateKey',
    'startDate',
  ]);
  // Check-out is often returnDate / endDate / bookModel.endDate — not always checkOutDate.
  const checkOutRaw = hotelField(data, walkIn, service, [
    'checkOutDate',
    'checkOut',
    'returnDate',
    'endDate',
    'departureDate',
  ]);
  // confirmationNo / ADDRESS / MEAL PLAN — sync extract from same sale doc (no 2nd fetch).
  const conf = extractHotelSaleConfirmationDetails(data);
  const mealPlan = conf.mealPlan;
  const address = conf.address;
  const telephone = hotelField(data, walkIn, service, [
    'hotelPhone',
    'telephone',
    'phone',
    'contactPhone',
  ]);
  const specialRequestsRaw = hotelField(data, walkIn, service, [
    'specialRequests',
    'specialRequest',
    'requests',
  ]);
  const cancellationTerms =
    hotelField(data, walkIn, service, [
      'cancellationPolicy',
      'cancellationPolicyType',
      'cancellationTerms',
      'cancelPolicy',
    ]) || readString(data.cancellationPolicy);

  const hotelName =
    hotelField(data, walkIn, service, [
      'nameOfHotel',
      'hotelBrand',
      'customHotelBrand',
      'hotelAirlines',
    ]) ||
    readString(data.hotelBrand) ||
    readString(data.serviceName) ||
    'Hotel';

  const confirmationNo =
    conf.confirmationNo ?? base.confirmationNo ?? readString(data.confirmationNo);

  const checkIn = formatHotelDateTime(checkInRaw, '15:00');
  const checkOut = formatHotelDateTime(checkOutRaw, '12:00');
  const nights = nightsBetween(checkInRaw, checkOutRaw);
  const travellers = base.travellerNames.length > 0 ? base.travellerNames.join(', ') : null;

  const specialRequests = splitBullets(specialRequestsRaw);
  const { godwitBenefits, benefitsSource } = extractGodwitBenefitsFromHotelSale(
    data,
    partnershipData,
  );

  const missingFields: string[] = [];
  if (!room) missingFields.push('roomType');
  if (!checkInRaw) missingFields.push('checkInDate');
  if (!checkOutRaw) missingFields.push('checkOutDate');
  if (!mealPlan) missingFields.push('mealPlan');
  if (!address) missingFields.push('addressOfHotel');
  if (!telephone) missingFields.push('telephone');
  if (!specialRequestsRaw) missingFields.push('specialRequests');
  if (benefitsSource === 'none') {
    missingFields.push('godwitBenefits');
  }
  if (!cancellationTerms) missingFields.push('cancellationPolicy');
  if (!confirmationNo) missingFields.push('confirmationNo');

  // ROOM first (mock), then stay dates — empty rows are omitted.
  const rows: DetailRow[] = [];
  pushRow(rows, 'ROOM', room);
  pushRow(rows, 'CHECK-IN', checkIn);
  pushRow(rows, 'CHECK-OUT', checkOut);
  pushRow(rows, 'NIGHTS', nights);
  pushRow(rows, 'MEAL PLAN', mealPlan);
  pushRow(rows, 'ADDRESS', address);
  pushRow(rows, 'TELEPHONE', telephone, 'phone');
  pushRow(rows, 'TRAVELLERS', travellers);

  // Header under hotel name: "Deluxe Suite - 3 nights"
  const nightsLabel = nights ? (Number(nights) === 1 ? '1 night' : `${nights} nights`) : null;
  const headerSubtitle = [room, nightsLabel].filter(Boolean).join(' - ') || null;

  return {
    ...base,
    title: hotelName,
    subtitle: headerSubtitle,
    serviceTypeLabel: 'Hotel',
    confirmationNo,
    confirmationBadge: conf.confirmationBadge ?? confirmationBadge(confirmationNo),
    detailRows: sortHotelDetailRows(rows),
    specialRequests,
    cancellationTerms,
    godwitBenefits,
    showMessageGodwitCta: true,
    missingForMockup: missingFields,
  };
}
