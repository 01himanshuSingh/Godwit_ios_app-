/**
 * Pure mapper: sale doc → ClientInvoiceDetail (service-based, no fake destination).
 */

import type { DocumentData, Timestamp } from 'firebase/firestore';

import type {
  ClientInvoiceDetail,
  InvoiceLineItem,
} from '@/lib/firebase/payments/invoiceDetailTypes';
import { invoiceTitle } from '@/lib/firebase/payments/mapSaleToInvoiceItem';

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

function formatLongDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDayMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

/** Prefer ISO word codes (USD), never "$". */
function normalizeCurrency(raw: string | null): string {
  const c = (raw || 'USD').trim().toUpperCase();
  if (!c || c === '$' || c === 'US$' || c === 'DOLLAR' || c === 'DOLLARS') return 'USD';
  return c;
}

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${Math.abs(amount).toLocaleString('en-US')}`;
}

export function saleAmount(data: DocumentData): number {
  const w = asRecord(data.walkInModel);
  return (
    readNumber(
      w.finalAmount ?? w.totalAmount ?? w.billingInst ?? data.totalAmount ?? data.finalAmount,
    ) || 0
  );
}

/**
 * Trip ref: travel dates only. City only when destinationCity is explicitly filled.
 * e.g. "28–31 October" or "Dubai, 28–31 October"
 */
export function tripReferenceFromSale(data: DocumentData): string | null {
  const w = asRecord(data.walkInModel);
  const start = toDate(w.travelDate) || toDate(w.checkIn);
  const end = toDate(w.checkOut) || toDate(w.returnDate);
  const city = readString(w.destinationCity);

  let dates: string | null = null;
  if (start && end) {
    const sameMonth =
      start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    if (sameMonth) {
      dates = `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString('en-GB', {
        month: 'long',
      })}`;
    } else {
      dates = `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
    }
  } else if (start) {
    dates = formatDayMonth(start);
  }

  if (city && dates) return `${city}, ${dates}`;
  return dates || city || null;
}

export function mapSaleToInvoiceDetail(
  saleId: string,
  data: DocumentData,
  clientId: string,
  documentPath: string,
  clientNameFallback = '',
): ClientInvoiceDetail {
  const w = asRecord(data.walkInModel);
  const title = invoiceTitle(data);
  const amount = saleAmount(data);
  const currency = normalizeCurrency(readString(data.currency) || readString(w.currency));
  const invoiceNumber = readString(w.invoiceNo) || saleId;

  const issueDate =
    toDate(data.saleMadeOn) || toDate(data.date) || toDate(data.createdAt) || toDate(w.saleMadeOn);

  const clientName =
    readString(data.clientName) || readString(w.clientName) || readString(clientNameFallback) || '';

  const line: InvoiceLineItem = {
    description: title,
    amount,
    amountLabel: formatMoney(currency, amount),
  };

  const voucherUrl = readString(data.confirmationDoc) || readString(w.confirmationDoc) || null;

  return {
    saleId,
    clientId,
    invoiceNumber,
    title,
    clientName,
    issueDateKey: toDateKey(issueDate),
    issueDateLabel: formatLongDate(issueDate),
    tripReference: tripReferenceFromSale(data),
    currency,
    lineItems: [line],
    total: amount,
    totalLabel: formatMoney(currency, amount),
    paid: null,
    outstanding: null,
    status: data.saleStatus === false ? 'cancelled' : 'sold',
    statusBadge: null,
    pdfUrl: null,
    voucherUrl,
    documentPath,
  };
}
