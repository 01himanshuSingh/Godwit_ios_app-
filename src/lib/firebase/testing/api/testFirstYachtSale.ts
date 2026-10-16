/**
 * Testing helper — first Yacht Instant Sale for session client.
 * Testing tab only — not used by Trips / Active Trip UI.
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 */

import { collection, getDocs, type DocumentData, type Firestore } from 'firebase/firestore';

import { db as defaultDb } from '@/lib/firebase/firestore';

export type YachtSaleTestReport = {
  foundYachtSale: boolean;
  adminId: string | null;
  clientId: string | null;
  saleId: string | null;
  documentPath: string | null;
  displayTime: string | null;
  serviceTypeLabel: 'Yacht';
  title: string | null;
  detailLine: string | null;
  statusLabel: 'Confirmed' | 'Cancelled' | null;
  destinationCity: string | null;
  brand: string | null;
  yachtDescription: string | null;
  mealDescription: string | null;
  bookingReference: string | null;
  serviceDate: string | null;
  errorMessage: string | null;
};

function emptyReport(
  errorMessage: string | null = null,
  adminId: string | null = null,
  clientId: string | null = null,
): YachtSaleTestReport {
  return {
    foundYachtSale: false,
    adminId,
    clientId,
    saleId: null,
    documentPath: null,
    displayTime: null,
    serviceTypeLabel: 'Yacht',
    title: null,
    detailLine: null,
    statusLabel: null,
    destinationCity: null,
    brand: null,
    yachtDescription: null,
    mealDescription: null,
    bookingReference: null,
    serviceDate: null,
    errorMessage,
  };
}

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
  if (!value) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
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
  if (!d) {
    return null;
  }
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDateLabel(d: Date | null): string | null {
  if (!d) {
    return null;
  }
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isYachtSale(data: DocumentData): boolean {
  const service = Array.isArray(data.serviceModelList) ? asRecord(data.serviceModelList[0]) : null;
  const name = String(service?.serviceName || data.serviceName || '').toLowerCase();
  const kind = String(data.serviceKind || service?.serviceKind || '')
    .trim()
    .toLowerCase();
  const walkIn = asRecord(data.walkInModel) ?? {};
  return (
    kind === 'yacht' ||
    kind.includes('yacht') ||
    name.includes('yacht') ||
    service?.isYacht === true ||
    data.isYacht === true ||
    !!readString(walkIn.yachtDescription)
  );
}

function extractDurationHint(text: string | null): string | null {
  if (!text) {
    return null;
  }
  const m = text.match(/\b(\d+(?:\.\d+)?\s*hours?|\d+\s*hrs?)\b/i);
  return m ? m[1].replace(/\s+/g, ' ') : null;
}

function mapYachtCard(data: DocumentData): {
  displayTime: string | null;
  title: string;
  detailLine: string | null;
  statusLabel: 'Confirmed' | 'Cancelled';
  destinationCity: string | null;
  brand: string | null;
  yachtDescription: string | null;
  mealDescription: string | null;
  bookingReference: string | null;
  serviceDate: string | null;
} {
  const walkIn = asRecord(data.walkInModel) ?? {};
  const whenDate = toDate(walkIn.serviceDateTime ?? walkIn.travelDate ?? data.travelDate);
  const destinationCity = readString(walkIn.destinationCity);
  const brand = readString(walkIn.category) || readString(walkIn.brand);
  const description = readString(walkIn.route) || readString(walkIn.description);
  const yachtDescription = readString(walkIn.yachtDescription) || description;
  const mealDescription = readString(walkIn.mealDescription);
  const bookingReference = readString(walkIn.bookingReference) || readString(data.confirmationNo);

  const title =
    [description || 'Yacht', destinationCity].filter(Boolean).join(', ') ||
    brand ||
    readString(data.serviceName) ||
    'Yacht';

  const duration =
    extractDurationHint(yachtDescription) ||
    extractDurationHint(description) ||
    extractDurationHint(readString(walkIn.billingInvoice));
  const detailLine = [brand || yachtDescription, duration].filter(Boolean).join(' · ') || null;

  const active = data.saleStatus !== false && data.status !== false;

  return {
    displayTime: formatHm(whenDate),
    title,
    detailLine,
    statusLabel: active ? 'Confirmed' : 'Cancelled',
    destinationCity,
    brand,
    yachtDescription,
    mealDescription,
    bookingReference,
    serviceDate: formatDateLabel(whenDate),
  };
}

/**
 * Load client sales → first yacht sale → card fields for Testing tab.
 */
export async function testFirstYachtSale(
  adminId: string,
  clientId: string,
  firestore: Firestore = defaultDb,
): Promise<YachtSaleTestReport> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    return emptyReport('adminId and clientId are required');
  }

  try {
    const salesRef = collection(firestore, 'admins', aid, 'clients', cid, 'sales');
    const snap = await getDocs(salesRef);

    let firstYacht: { id: string; path: string; data: DocumentData } | null = null;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (!isYachtSale(data)) {
        continue;
      }
      firstYacht = {
        id: String(data.saleId || data.customerVisitId || docSnap.id).trim(),
        path: docSnap.ref.path,
        data,
      };
      break;
    }

    if (!firstYacht) {
      return emptyReport('No yacht Instant Sale found for this client', aid, cid);
    }

    const card = mapYachtCard(firstYacht.data);

    return {
      foundYachtSale: true,
      adminId: aid,
      clientId: cid,
      saleId: firstYacht.id,
      documentPath: firstYacht.path,
      displayTime: card.displayTime,
      serviceTypeLabel: 'Yacht',
      title: card.title,
      detailLine: card.detailLine,
      statusLabel: card.statusLabel,
      destinationCity: card.destinationCity,
      brand: card.brand,
      yachtDescription: card.yachtDescription,
      mealDescription: card.mealDescription,
      bookingReference: card.bookingReference,
      serviceDate: card.serviceDate,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load yacht sale test';
    console.error('[testFirstYachtSale]', error);
    return emptyReport(message, aid, cid);
  }
}

export function logYachtSaleTest(report: YachtSaleTestReport): void {
  if (!report.foundYachtSale) {
    console.log('[yacht-sale-test]', report.errorMessage || 'no yacht sale');
    return;
  }
  console.log(
    '[yacht-sale-test]',
    `title=${report.title ?? '—'}`,
    `detail=${report.detailLine ?? '—'}`,
    `time=${report.displayTime ?? '—'}`,
    `saleId=${report.saleId}`,
  );
}
