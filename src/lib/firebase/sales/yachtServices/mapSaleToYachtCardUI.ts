/**
 * Yacht Instant Sale → list/detail card UI.
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * Upcoming card ← sale fields:
 *   YACHT     → serviceType === 'yacht' (serviceName includes "yacht")
 *   Title     → walkIn.route + destinationCity   e.g. "Day charter, Capri"
 *   Subtitle  → walkIn.category + duration hint  e.g. "Sanlorenzo SL78 · 8 hours"
 *   Time      → travelDate / serviceDateTime     e.g. "09:30"
 */

import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore';

import { db as defaultDb } from '@/lib/firebase/firestore';

export type YachtSaleCardUI = {
  saleId: string;
  adminId: string;
  clientId: string;
  documentPath: string;
  /** Left time on card, e.g. "09:30" */
  displayTime: string | null;
  serviceTypeLabel: 'Yacht';
  /** Main title: "Day charter, Capri" */
  title: string;
  /** Subtitle: "Sanlorenzo SL78 · 8 hours" */
  detailLine: string | null;
  statusLabel: 'Confirmed' | 'Cancelled';
  /** Extra fields for detail screen */
  serviceDate: string | null;
  destinationCity: string | null;
  brand: string | null;
  yachtDescription: string | null;
  mealDescription: string | null;
  guestCount: number | null;
  bookingReference: string | null;
  ticketNumber: string | null;
  cancellationTerms: string | null;
  errorMessage: string | null;
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

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  const sec =
    (value as { seconds?: unknown })?.seconds ?? (value as { _seconds?: unknown })?._seconds;
  if (typeof sec === 'number' && Number.isFinite(sec)) {
    return new Date(sec * 1000);
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatHm(d: Date | null): string | null {
  if (!d) return null;
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null; // date-only Instant Sale
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDateLabel(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function findServiceFormField(
  service: DocumentData | null | undefined,
  fieldKey: string,
): string | null {
  if (!service) return null;
  const sections =
    (service.additionalFields as unknown[]) || (service.additionalProperties as unknown[]) || [];
  if (!Array.isArray(sections)) return null;
  for (const section of sections) {
    const sec = asRecord(section);
    const fields = Array.isArray(sec?.fields) ? sec.fields : [];
    for (const field of fields) {
      const f = asRecord(field);
      if (f && String(f.fieldKey || '') === fieldKey) {
        const v = readString(f.value) ?? readString(f.dateValue) ?? readString(f.textValue);
        if (v) return v;
      }
    }
  }
  return null;
}

function pick(
  walkIn: DocumentData,
  service: DocumentData | null,
  data: DocumentData,
  keys: string[],
): string | null {
  for (const key of keys) {
    const fromWalkIn = readString(walkIn[key]);
    if (fromWalkIn) return fromWalkIn;
    const fromTop = readString(data[key]);
    if (fromTop) return fromTop;
    const fromForm = findServiceFormField(service, key);
    if (fromForm) return fromForm;
  }
  return null;
}

function extractDurationHint(text: string | null): string | null {
  if (!text) return null;
  const m = text.match(/\b(\d+(?:\.\d+)?\s*hours?|\d+\s*hrs?)\b/i);
  return m ? m[1].replace(/\s+/g, ' ') : null;
}

/** True when text looks like INCLUDED / yachtDescription, not a brand or charter type. */
function looksLikeYachtIncludedText(text: string | null): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;
  if (t.includes('·') || t.includes('•')) return true;
  if (t.length > 60) return true;
  if (/,.*,/.test(t)) return true; // multi-item comma list
  if (/\b(crew|lunch|tender|water toys|captain)\b/i.test(t)) return true;
  return false;
}

/** Brand subtitle: category only — never yachtDescription / included text. */
function readYachtBrandCategory(walkIn: DocumentData): string | null {
  const category = readString(walkIn.category);
  if (category && !looksLikeYachtIncludedText(category)) {
    return category;
  }
  const brand = readString(walkIn.brand) ?? readString(walkIn.hotelBrand);
  if (brand && !looksLikeYachtIncludedText(brand)) {
    return brand;
  }
  return null;
}

/** Fields the Upcoming Trips row binds to for yacht. */
export type YachtUpcomingCardFields = {
  /** Left column — from travelDate / serviceDateTime */
  displayTime: string | null;
  /** Main title — walkIn.route + destinationCity */
  title: string;
  /** Subtitle — walkIn.category + duration hint */
  detailLine: string | null;
  statusLabel: 'Confirmed' | 'Cancelled';
};

/**
 * Upcoming list card fields only (same sources as the mock).
 * Used by getClientUpcomingSales → mapSaleDoc → UpcomingTripRow.
 */
export function mapYachtUpcomingCardFields(saleData: DocumentData): YachtUpcomingCardFields {
  const walkIn = asRecord(saleData.walkInModel) ?? {};

  // Time ← travelDate / serviceDateTime
  const whenDate = toDate(
    walkIn.travelDate ?? walkIn.serviceDateTime ?? saleData.travelDate ?? saleData.serviceDateTime,
  );

  // Title ← usable walkIn.route + destinationCity (never included text / "_, Capri")
  const routeRaw = readString(walkIn.route);
  const route =
    routeRaw &&
    routeRaw !== '_' &&
    !/^[_\-–—.\s]+$/.test(routeRaw) &&
    !looksLikeYachtIncludedText(routeRaw)
      ? routeRaw
      : null;
  const destinationCity = readString(walkIn.destinationCity);
  const brand = readYachtBrandCategory(walkIn);
  const cityAlreadyInTitle =
    !!destinationCity && !!route && route.toLowerCase().includes(destinationCity.toLowerCase());
  // Prefer destination alone when route is missing/invalid — no leading ", Capri"
  const title = route
    ? cityAlreadyInTitle
      ? route
      : [route, destinationCity].filter(Boolean).join(', ')
    : destinationCity || brand || readString(saleData.serviceName) || 'Yacht';

  // List subtitle: brand (category) + duration — never put yachtDescription in the brand slot
  const duration =
    extractDurationHint(readString(walkIn.yachtDescription)) ||
    extractDurationHint(readString(walkIn.duration)) ||
    extractDurationHint(readString(walkIn.billingInvoice)) ||
    extractDurationHint(route) ||
    (readString(walkIn.durationHours) ? `${readString(walkIn.durationHours)} hours` : null);
  const detailLine = [brand, duration].filter(Boolean).join(' · ') || null;

  const active = saleData.saleStatus !== false && saleData.status !== false;

  return {
    displayTime: formatHm(whenDate),
    title,
    detailLine,
    statusLabel: active ? 'Confirmed' : 'Cancelled',
  };
}

function emptyYachtCard(opts: {
  adminId: string;
  clientId: string;
  saleId: string;
  documentPath: string;
  errorMessage: string | null;
}): YachtSaleCardUI {
  return {
    saleId: opts.saleId,
    adminId: opts.adminId,
    clientId: opts.clientId,
    documentPath: opts.documentPath,
    displayTime: null,
    serviceTypeLabel: 'Yacht',
    title: 'Yacht',
    detailLine: null,
    statusLabel: 'Confirmed',
    serviceDate: null,
    destinationCity: null,
    brand: null,
    yachtDescription: null,
    mealDescription: null,
    guestCount: null,
    bookingReference: null,
    ticketNumber: null,
    cancellationTerms: null,
    errorMessage: opts.errorMessage,
  };
}

export function mapSaleToYachtCardUI(
  saleData: DocumentData,
  opts: { adminId: string; clientId: string; saleId: string; documentPath: string },
): Omit<YachtSaleCardUI, 'errorMessage'> {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;

  const card = mapYachtUpcomingCardFields(saleData);
  const whenDate = toDate(
    walkIn.travelDate ?? walkIn.serviceDateTime ?? saleData.travelDate ?? saleData.serviceDateTime,
  );

  const destinationCity =
    readString(walkIn.destinationCity) ??
    pick(walkIn, service, saleData, ['destinationCity', 'cityName']);
  const brand =
    readString(walkIn.category) ??
    pick(walkIn, service, saleData, ['category', 'brand', 'hotelBrand']);
  // Prefer walkInModel.yachtDescription (same field as detail INCLUDED)
  const yachtDescription =
    readString(walkIn.yachtDescription) ?? pick(walkIn, service, saleData, ['yachtDescription']);
  const mealDescription = pick(walkIn, service, saleData, ['mealDescription']);
  const route = readString(walkIn.route);

  const guestRaw =
    walkIn.travellerCount ??
    walkIn.travelerCount ??
    findServiceFormField(service, 'travelerCount') ??
    findServiceFormField(service, 'travellerCount');
  const guestParsed = guestRaw != null && guestRaw !== '' ? Number(guestRaw) : null;

  const bookingReference =
    pick(walkIn, service, saleData, ['bookingReference', 'pnr']) ||
    readString(saleData.confirmationNo);
  const ticketNumber = pick(walkIn, service, saleData, ['ticketNumber']);
  const cancellationTerms =
    pick(walkIn, service, saleData, ['cancellationText', 'cancellationPolicy']) ||
    readString(saleData.cancellationPolicy);

  return {
    saleId: opts.saleId,
    adminId: opts.adminId,
    clientId: opts.clientId,
    documentPath: opts.documentPath,
    displayTime: card.displayTime,
    serviceTypeLabel: 'Yacht',
    title: card.title,
    detailLine: card.detailLine,
    statusLabel: card.statusLabel,
    serviceDate: formatDateLabel(whenDate),
    destinationCity,
    brand,
    yachtDescription: yachtDescription || route,
    mealDescription,
    guestCount: Number.isFinite(guestParsed as number) ? (guestParsed as number) : null,
    bookingReference,
    ticketNumber,
    cancellationTerms,
  };
}

/** Prefer mapSaleToYachtCardUI(saleData) after shared getDoc in list/detail fetch. */
export async function getYachtSaleCard(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<YachtSaleCardUI> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();

  if (!aid || !cid || !sid) {
    return emptyYachtCard({
      adminId: aid,
      clientId: cid,
      saleId: sid,
      documentPath: '',
      errorMessage: 'adminId, clientId and saleId are required',
    });
  }

  try {
    const ref = doc(firestore, 'admins', aid, 'clients', cid, 'sales', sid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return emptyYachtCard({
        adminId: aid,
        clientId: cid,
        saleId: sid,
        documentPath: ref.path,
        errorMessage: 'Sale not found',
      });
    }

    const mapped = mapSaleToYachtCardUI(snap.data(), {
      adminId: aid,
      clientId: cid,
      saleId: sid,
      documentPath: snap.ref.path,
    });
    return { ...mapped, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load yacht sale';
    console.error('[getYachtSaleCard]', error);
    return emptyYachtCard({
      adminId: aid,
      clientId: cid,
      saleId: sid,
      documentPath: '',
      errorMessage: message,
    });
  }
}
