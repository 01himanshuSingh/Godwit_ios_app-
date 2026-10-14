/**
 * Map Instant Sale cancellation fields → Active Trip "CANCELLATION TERMS" card.
 *
 * UI mock:
 *   CANCELLATION TERMS
 *   Complimentary cancellation until 14:00 CET on 25 October.
 *   One night charged thereafter.
 *
 * Firestore (same sale doc — no separate collection):
 *   Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * CRM Instant Sale fields (walkInModel — set for every service):
 *   cancellationPolicyType  → "Refundable" | "Non-Refundable"
 *   cancellationText        → policy details
 *   cancellationPolicy      → usually same as cancellationText
 *   cancellationDate        → free-cancel-by date (Timestamp / string)
 *
 * System design:
 *   getDoc(sales/{saleId}) once
 *     → extractHotelCancellationTerms(saleData)  // sync
 *     → detail.cancellationTerms = result.displayParagraph
 *     → CancellationTermsCard (hide when null)
 *
 * Usable for any service type that stamps walkIn cancellation fields.
 */

import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore';

import { db as defaultDb } from '@/lib/firebase/firestore';

export type CancellationPolicyType = 'Refundable' | 'Non-Refundable' | 'unknown';

export type ExtractedHotelCancellationTerms = {
  /** Full paragraph for the CANCELLATION TERMS card body */
  displayParagraph: string | null;
  policyType: CancellationPolicyType;
  /** Raw CRM policy text */
  policyText: string | null;
  /** Free-cancel-by date when Refundable */
  cancellationDate: Date | null;
  /** Formatted date e.g. "25 October 2026" */
  cancellationDateLabel: string | null;
  /** Pieces the mock has that CRM did not store */
  missingForMock: string[];
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
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
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
        const v = readString(f.value) ?? readString(f.dateValue) ?? readString(f.textValue);
        if (v) {
          return v;
        }
      }
    }
  }
  return null;
}

function findServiceFormDate(
  service: DocumentData | null | undefined,
  fieldKey: string,
): Date | null {
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
        const d = toDate(f.dateValue) || toDate(f.value) || toDate(f.textValue);
        if (d) {
          return d;
        }
      }
    }
  }
  return null;
}

function resolvePolicyType(
  walkIn: DocumentData,
  policyText: string | null,
): CancellationPolicyType {
  const raw = readString(walkIn.cancellationPolicyType);
  if (raw === 'Refundable' || raw === 'refundable') {
    return 'Refundable';
  }
  if (raw === 'Non-Refundable' || raw === 'nonRefundable' || raw === 'non-refundable') {
    return 'Non-Refundable';
  }

  const text = (policyText || '').toLowerCase();
  if (text.includes('non-refundable') || text === 'non refundable') {
    return 'Non-Refundable';
  }
  if (
    text.startsWith('free cancellation') ||
    text.includes('complimentary cancellation') ||
    text.includes('refundable')
  ) {
    return 'Refundable';
  }
  return 'unknown';
}

/**
 * Prefer CRM sentence if it already looks like a full policy.
 * Otherwise compose from type + date (no invented time/tz/penalty).
 */
function buildDisplayParagraph(opts: {
  policyType: CancellationPolicyType;
  policyText: string | null;
  cancellationDate: Date | null;
  dateLabel: string | null;
}): { paragraph: string | null; missingForMock: string[] } {
  const missingForMock: string[] = [];
  const text = opts.policyText?.trim() || null;

  if (text && text.length > 24 && /[.!]/.test(text)) {
    if (!/\d{1,2}:\d{2}/.test(text)) {
      missingForMock.push('cancellationTime');
    }
    if (!/\b(CET|CEST|UTC|GMT|EST|EDT)\b/i.test(text)) {
      missingForMock.push('timezone');
    }
    return { paragraph: text, missingForMock };
  }

  if (opts.policyType === 'Non-Refundable') {
    return {
      paragraph: text && text.toLowerCase().includes('non-refundable') ? text : 'Non-refundable.',
      missingForMock: [],
    };
  }

  if (opts.policyType === 'Refundable' || opts.dateLabel) {
    if (!opts.dateLabel) {
      missingForMock.push('cancellationDate');
    }
    missingForMock.push('cancellationTime', 'timezone', 'penaltyAfterDeadline');

    if (opts.dateLabel) {
      const base =
        text &&
        (text.toLowerCase().startsWith('free cancellation') ||
          text.toLowerCase().startsWith('complimentary cancellation'))
          ? 'Complimentary cancellation'
          : text && text.length > 3 && !text.toLowerCase().endsWith('before')
            ? text.replace(/\.*$/, '')
            : 'Complimentary cancellation';

      return {
        paragraph: `${base} until ${opts.dateLabel}.`,
        missingForMock,
      };
    }

    if (text) {
      return {
        paragraph: text.endsWith('.') ? text : `${text}.`,
        missingForMock,
      };
    }
  }

  if (text) {
    return {
      paragraph: text.endsWith('.') ? text : `${text}.`,
      missingForMock: ['cancellationDate', 'cancellationTime', 'timezone'],
    };
  }

  return { paragraph: null, missingForMock: ['cancellationPolicy'] };
}

/**
 * Core extract — pass Instant Sale doc already loaded in getActiveTripDetail.
 * Works for any service that stamps walkIn cancellation fields.
 */
export function extractHotelCancellationTerms(
  saleData: DocumentData,
): ExtractedHotelCancellationTerms {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;

  const policyText =
    readString(walkIn.cancellationText) ||
    readString(walkIn.cancellationPolicy) ||
    readString(saleData.cancellationPolicy) ||
    findServiceFormField(service, 'cancellationPolicy') ||
    findServiceFormField(service, 'cancellationText');

  const cancellationDate =
    toDate(walkIn.cancellationDate) ||
    toDate(saleData.cancellationDate) ||
    findServiceFormDate(service, 'cancellationDate') ||
    toDate(findServiceFormField(service, 'cancellationDate'));

  const policyType = resolvePolicyType(walkIn, policyText);
  const dateLabel = formatDateLabel(cancellationDate);

  const { paragraph, missingForMock } = buildDisplayParagraph({
    policyType,
    policyText,
    cancellationDate,
    dateLabel,
  });

  return {
    displayParagraph: paragraph,
    policyType,
    policyText,
    cancellationDate,
    cancellationDateLabel: dateLabel,
    missingForMock,
  };
}

export async function fetchHotelCancellationTerms(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<ExtractedHotelCancellationTerms> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) {
    throw new Error('adminId, clientId and saleId are required');
  }

  const ref = doc(firestore, 'admins', aid, 'clients', cid, 'sales', sid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return {
      displayParagraph: null,
      policyType: 'unknown',
      policyText: null,
      cancellationDate: null,
      cancellationDateLabel: null,
      missingForMock: ['sale'],
    };
  }
  return extractHotelCancellationTerms(snap.data());
}

/** Wire into Active Trip detail after map — any service. */
export function applyHotelCancellationTermsToDetail<T extends { cancellationTerms: string | null }>(
  detail: T,
  saleData: DocumentData,
): T {
  const extracted = extractHotelCancellationTerms(saleData);
  return {
    ...detail,
    cancellationTerms: extracted.displayParagraph ?? detail.cancellationTerms,
  };
}
