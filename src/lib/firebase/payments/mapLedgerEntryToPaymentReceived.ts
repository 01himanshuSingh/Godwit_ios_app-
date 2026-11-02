/**
 * Pure: one clientLedger row → PaymentReceivedItem | null.
 * Skips non-receipt / bad credit rows (keeps listing others).
 */

import type {
  ClientLedgerReceiptRow,
  PaymentReceivedItem,
  PaymentReceivedStatus,
} from '@/lib/firebase/payments/paymentsReceivedTypes';

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

function readString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function readCreditUsd(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatAmountLabel(amountUsd: number): string {
  return `USD ${amountUsd.toLocaleString('en-US')}`;
}

function formatDateLabel(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function resolveStatus(row: ClientLedgerReceiptRow): {
  status: PaymentReceivedStatus;
  statusLabel: string;
} {
  const statusRaw = readString(row.status).toLowerCase();
  if (statusRaw === 'cleared' || row.cleared === true) {
    return { status: 'cleared', statusLabel: 'Cleared' };
  }
  return { status: 'received', statusLabel: 'Received' };
}

/**
 * Map a ledger entry to a payments-received row.
 * Returns null when the row should be skipped (not a receipt credit / bad amount).
 */
export function mapLedgerEntryToPaymentReceived(
  row: ClientLedgerReceiptRow,
  fallbackId = '',
): PaymentReceivedItem | null {
  const source = readString(row.source).toLowerCase();
  const credit = readCreditUsd(row.creditUsd);
  if (source !== 'receipt' || credit === null || !(credit > 0)) {
    return null;
  }

  const amountUsd = Math.round(credit * 100) / 100;
  const bankName = readString(row.bankName) || null;
  const docNo = readString(row.docNo);
  const particulars = readString(row.particulars) || 'Payment received';
  const date = toDate(row.date);
  const receiptUrl = readString(row.receiptUrl) || null;
  const { status, statusLabel } = resolveStatus(row);

  const bits = [formatDateLabel(date), docNo || null, particulars].filter(Boolean);

  return {
    entryId: readString(row.entryId) || readString(row.id) || fallbackId,
    date,
    amountUsd,
    title: bankName || 'Payment',
    subtitle: bits.join(' · '),
    docNo,
    bankName,
    particulars,
    receiptUrl,
    status,
    statusLabel,
    amountLabel: formatAmountLabel(amountUsd),
  };
}

/** Filter + map + newest-first sort (pure). */
export function mapLedgerEntriesToPaymentsReceived(
  entries: ClientLedgerReceiptRow[],
): PaymentReceivedItem[] {
  const items: PaymentReceivedItem[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const mapped = mapLedgerEntryToPaymentReceived(entries[i], String(i));
    if (mapped) items.push(mapped);
  }
  return items.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}
