/**
 * Pure mapper: sale doc → ClientInvoiceItem (service-based title, no destination).
 */

import type { DocumentData, Timestamp } from 'firebase/firestore';

import type { ClientInvoiceItem } from '@/lib/firebase/payments/invoiceTypes';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

function asRecord(value: unknown): DocumentData {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DocumentData) : {};
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof (value as Timestamp)?.toDate === 'function') {
    try {
      const d = (value as Timestamp).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const s = String(value).trim();
    const d = new Date(s.includes('T') ? s : s.length >= 10 ? `${s.slice(0, 10)}T12:00:00` : s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toDateKey(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatIssuedLabel(d: Date | null): string | null {
  if (!d) return null;
  const label = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `Issued ${label}`;
}

/** Prefer ISO word codes (USD), never "$". */
function normalizeCurrency(raw: string | null): string {
  const c = (raw || 'USD').trim().toUpperCase();
  if (!c || c === '$' || c === 'US$' || c === 'DOLLAR' || c === 'DOLLARS') return 'USD';
  return c;
}

/**
 * Service-only title — never destination / city.
 * e.g. "Hotel – Aman" / "Yacht" / "Chauffeur – Airport Arrival"
 */
export function invoiceTitle(data: DocumentData): string {
  const w = asRecord(data.walkInModel);
  const service0 =
    Array.isArray(data.serviceModelList) && data.serviceModelList[0]
      ? asRecord(data.serviceModelList[0])
      : {};

  const service =
    readString(data.serviceName) ||
    readString(service0.serviceName) ||
    readString(w.hotelAirlines) ||
    readString(w.serviceType) ||
    'Service';

  const brand = readString(w.hotelBrand) || readString(w.category) || '';
  return brand ? `${service} – ${brand}` : service;
}

export function mapSaleToInvoiceItem(
  id: string,
  data: DocumentData,
  documentPath: string,
): ClientInvoiceItem {
  const w = asRecord(data.walkInModel);
  const amount = readNumber(
    w.finalAmount ?? w.totalAmount ?? w.billingInst ?? data.totalAmount ?? data.finalAmount,
  );
  const currency = normalizeCurrency(readString(data.currency) || readString(w.currency));
  const invoiceNo = readString(w.invoiceNo) || id;

  const issuedDate =
    toDate(data.saleMadeOn) || toDate(data.date) || toDate(data.createdAt) || toDate(w.saleMadeOn);

  const amountFormatted = Math.abs(amount).toLocaleString('en-US');

  return {
    saleId: id,
    title: invoiceTitle(data),
    invoiceNo,
    issuedAtKey: toDateKey(issuedDate),
    issuedAtLabel: formatIssuedLabel(issuedDate),
    currency,
    amount,
    amountLabel: `${currency} ${amountFormatted}`,
    documentPath,
  };
}
