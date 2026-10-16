/**
 * Instant Sale Yacht → Active Trip detail (mock-aligned).
 *
 * Fetch: getDoc(admins/{adminId}/clients/{clientId}/sales/{saleId}) once,
 * then this mapper shapes the UI.
 *
 * Field map (walkInModel unless noted):
 *   Title        ← route + destinationCity     → "Day charter, Capri"
 *   Subtitle     ← category (brand) only       → "Sanlorenzo SL78"
 *   Badge        ← serviceType / status / bookingReference|confirmationNo
 *   BEGINS       ← travelDate | serviceDateTime (+ clock)
 *   ENDS         ← returnDate | endDate (+ end time when present)
 *   INCLUDED     ← walkInModel.yachtDescription only
 *   TRAVELLERS   ← travellers[] / walkIn guest lists
 *
 * Do NOT show LOCATION in the UI.
 */
import type { DocumentData } from 'firebase/firestore';

import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/activeTripDetailTypes';
import { mapSaleToYachtCardUI } from '@/lib/firebase/sales/yachtServices/mapSaleToYachtCardUI';

type YachtMapBase = Omit<
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
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatBeginsEnds(d: Date | null, timeOverride?: string | null): string | null {
  if (!d) return null;
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hm = timeOverride ?? formatHm(d);
  return hm ? `${datePart}, ${hm}` : datePart;
}

/** INCLUDED display: split on commas / newlines / · → "A · B · C" */
function formatIncludedLine(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(/[\n;|]+|\s*[·•]\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return parts.join(' · ');
}

function pushRow(rows: DetailRow[], label: string, value: string | null | undefined) {
  const v = value?.trim();
  if (v) {
    rows.push({ label, value: v, kind: 'text' });
  }
}

export function mapYachtDetail(
  data: DocumentData,
  walkIn: DocumentData,
  _service: DocumentData | null,
  base: YachtMapBase,
): ActiveTripDetailBase {
  const card = mapSaleToYachtCardUI(data, {
    adminId: base.adminId,
    clientId: base.clientId,
    saleId: base.saleId,
    documentPath: base.documentPath,
  });

  // Always prefer sale.walkInModel from the fetched doc (authoritative).
  const w = asRecord(data.walkInModel) ?? asRecord(walkIn) ?? {};

  const beginsDate = toDate(w.travelDate ?? w.serviceDateTime ?? data.travelDate);
  const endsDate = toDate(w.returnDate ?? w.endDate ?? data.endDate) ?? beginsDate;
  const endTime =
    readString(w.checkOutTime) ??
    readString(w.endTime) ??
    readString(w.arrivalTime) ??
    formatHm(endsDate);

  const begins = formatBeginsEnds(beginsDate, card.displayTime);
  const ends = formatBeginsEnds(endsDate, endTime);

  // INCLUDED ← walkInModel.yachtDescription only (DB field)
  const yachtDescription = readString(w.yachtDescription);
  const included = formatIncludedLine(yachtDescription);

  // Subtitle ← walkInModel.category ONLY — never yachtDescription / included text
  const categoryRaw = readString(w.category);
  const categoryLooksLikeIncluded = Boolean(
    categoryRaw &&
    ((yachtDescription && categoryRaw.toLowerCase() === yachtDescription.toLowerCase()) ||
      categoryRaw.includes('·') ||
      categoryRaw.includes('•') ||
      categoryRaw.length > 60 ||
      /\b(crew|lunch|tender|water toys|captain)\b/i.test(categoryRaw)),
  );
  const categoryOnly = categoryRaw && !categoryLooksLikeIncluded ? categoryRaw : null;

  // Title ← list card title (route + city); never yachtDescription
  const title =
    card.title &&
    yachtDescription &&
    card.title.toLowerCase().includes(yachtDescription.toLowerCase().slice(0, 24))
      ? readString(w.destinationCity) || card.title
      : card.title;

  const detailRows: DetailRow[] = [];
  pushRow(detailRows, 'BEGINS', begins);
  pushRow(detailRows, 'ENDS', ends);
  pushRow(detailRows, 'INCLUDED', included);
  pushRow(
    detailRows,
    'TRAVELLERS',
    base.travellerNames.length ? base.travellerNames.join(', ') : null,
  );

  const bookingRef = card.bookingReference ?? base.confirmationNo;

  const missingForMockup: string[] = [];
  if (!card.displayTime) missingForMockup.push('service clock time');
  if (!categoryOnly) missingForMockup.push('walkInModel.category');
  if (!included) missingForMockup.push('walkInModel.yachtDescription');
  if (!endTime) missingForMockup.push('endTime');

  return {
    ...base,
    title,
    subtitle: categoryOnly,
    serviceTypeLabel: 'Yacht',
    statusLabel: card.statusLabel,
    confirmationNo: bookingRef,
    confirmationBadge: bookingRef
      ? /^confirmation\b/i.test(bookingRef)
        ? bookingRef
        : `Confirmation ${bookingRef}`
      : base.confirmationBadge,
    cancellationTerms: card.cancellationTerms ?? base.cancellationTerms,
    detailRows,
    showMessageGodwitCta: true,
    missingForMockup,
  };
}
