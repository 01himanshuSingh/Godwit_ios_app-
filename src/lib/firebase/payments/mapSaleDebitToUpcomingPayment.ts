/**
 * Pure: sale-debit ledger row + optional sale doc → UpcomingPaymentItem | null.
 */

import type { DocumentData } from 'firebase/firestore';

import type { ClientLedgerReceiptRow } from '@/lib/firebase/payments/paymentsReceivedTypes';
import type {
  UpcomingPaymentItem,
  UpcomingPaymentRowStatus,
} from '@/lib/firebase/payments/upcomingPaymentsTypes';

function readString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

function asRecord(value: unknown): DocumentData {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DocumentData) : {};
}

function startOfLocalDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDayMonth(date: Date | null): { dayLabel: string | null; monthLabel: string | null } {
  if (!date) return { dayLabel: null, monthLabel: null };
  return {
    dayLabel: String(date.getDate()),
    monthLabel: date
      .toLocaleDateString('en-GB', { month: 'short' })
      .replace(/\./g, '')
      .toUpperCase()
      .slice(0, 3),
  };
}

function formatAmountLabel(amountUsd: number): string {
  return `USD ${amountUsd.toLocaleString('en-US')}`;
}

function resolveRowStatus(
  date: Date | null,
  sale: DocumentData | null,
): { status: UpcomingPaymentRowStatus; statusLabel: string } {
  const paymentStatus = readString(sale?.paymentStatus || sale?.invoiceStatus).toLowerCase();
  const partial =
    sale?.partiallyPaid === true ||
    paymentStatus.includes('partial') ||
    paymentStatus === 'partially_paid';

  if (partial) {
    return { status: 'partial', statusLabel: 'Partially paid' };
  }

  if (date && date.getTime() < startOfLocalDay().getTime()) {
    return { status: 'overdue', statusLabel: 'Overdue' };
  }

  return { status: 'due', statusLabel: 'Due' };
}

function buildTitle(sale: DocumentData | null, row: ClientLedgerReceiptRow): string {
  const w = asRecord(sale?.walkInModel);
  const city =
    readString(w.destinationCity) ||
    readString(w.cityName) ||
    readString(sale?.destinationCity) ||
    readString(sale?.destinationName);
  const service =
    readString(sale?.serviceName) ||
    readString(w.hotelBrand) ||
    readString(w.category) ||
    readString(row.particulars) ||
    'Service';

  if (city && service && !service.toLowerCase().includes(city.toLowerCase())) {
    return `${city} – ${service}`;
  }
  return service;
}

function buildSubtitle(sale: DocumentData | null, row: ClientLedgerReceiptRow): string {
  const particulars = readString(row.particulars);
  if (particulars) return particulars;

  const w = asRecord(sale?.walkInModel);
  const city =
    readString(w.destinationCity) || readString(w.cityName) || readString(sale?.destinationCity);
  const hotel = readString(w.hotelBrand) || readString(w.category);
  const bits = [hotel, city].filter(Boolean);
  return bits.join(', ');
}

/** True when ledger row is a billable sale debit linked to a sale. */
export function isSaleDebitLedgerRow(row: ClientLedgerReceiptRow): boolean {
  const source = readString(row.source).toLowerCase();
  const debit = readNumber(row.debitUsd) ?? 0;
  const visitId = readString(row.customerVisitId);
  const cancelled = (row as { linkedSaleCancelled?: unknown }).linkedSaleCancelled === true;
  return source === 'sale' && debit > 0 && Boolean(visitId) && !cancelled;
}

export function mapSaleDebitToUpcomingPayment(
  row: ClientLedgerReceiptRow,
  sale: DocumentData | null,
  fallbackEntryId = '',
): UpcomingPaymentItem | null {
  if (!isSaleDebitLedgerRow(row)) return null;

  const debit = readNumber(row.debitUsd);
  if (debit === null || !(debit > 0)) return null;

  const billedUsd = Math.round(debit * 100) / 100;
  const saleId = readString(row.customerVisitId);
  const entryId = readString(row.entryId) || readString(row.id) || fallbackEntryId;
  const date = toDate(row.date);
  const { dayLabel, monthLabel } = formatDayMonth(date);
  const { status, statusLabel } = resolveRowStatus(date, sale);

  return {
    saleId,
    entryId,
    title: buildTitle(sale, row),
    subtitle: buildSubtitle(sale, row),
    billedUsd,
    amountLabel: formatAmountLabel(billedUsd),
    date,
    dayLabel,
    monthLabel,
    status,
    statusLabel,
  };
}
