/**
 * Pure: one clientLedger row → CreditRefundItem | null.
 * Skips non-refund / bad credit rows.
 */

import type {
  CreditRefundItem,
  CreditRefundStatus,
} from '@/lib/firebase/payments/creditsRefundsTypes';
import type { ClientLedgerReceiptRow } from '@/lib/firebase/payments/paymentsReceivedTypes';

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
  return `– USD ${amountUsd.toLocaleString('en-US')}`;
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
  status: CreditRefundStatus;
  statusLabel: string;
} {
  const statusRaw = readString(row.status).toLowerCase();
  if (statusRaw === 'cleared' || row.cleared === true) {
    return { status: 'cleared', statusLabel: 'Cleared' };
  }
  if (statusRaw === 'refunded') {
    return { status: 'refunded', statusLabel: 'Refunded' };
  }
  return { status: 'refunded', statusLabel: 'Refunded' };
}

/**
 * Map a ledger entry to a credits/refunds row.
 * Returns null when the row should be skipped.
 */
export function mapLedgerEntryToCreditRefund(
  row: ClientLedgerReceiptRow,
  fallbackId = '',
): CreditRefundItem | null {
  const source = readString(row.source).toLowerCase();
  const credit = readCreditUsd(row.creditUsd);
  if (source !== 'refund' || credit === null || !(credit > 0)) {
    return null;
  }

  const amountUsd = Math.round(credit * 100) / 100;
  const docNo = readString(row.docNo);
  const particulars = readString(row.particulars) || 'Sale cancellation refund';
  const date = toDate(row.date);
  const receiptUrl = readString(row.receiptUrl) || null;
  const { status, statusLabel } = resolveStatus(row);

  const bits = [formatDateLabel(date), docNo || null, particulars].filter(Boolean);

  return {
    entryId: readString(row.entryId) || readString(row.id) || fallbackId,
    date,
    amountUsd,
    title: 'Refund',
    subtitle: bits.join(' · '),
    docNo,
    particulars,
    receiptUrl,
    status,
    statusLabel,
    amountLabel: formatAmountLabel(amountUsd),
  };
}

/** Filter + map + newest-first sort (pure). */
export function mapLedgerEntriesToCreditsRefunds(
  entries: ClientLedgerReceiptRow[],
): CreditRefundItem[] {
  const items: CreditRefundItem[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const mapped = mapLedgerEntryToCreditRefund(entries[i], String(i));
    if (mapped) items.push(mapped);
  }
  return items.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}
