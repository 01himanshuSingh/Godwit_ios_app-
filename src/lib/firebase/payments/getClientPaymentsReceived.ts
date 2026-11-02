/**
 * Payments received for Profile → Payments.
 * Receipt credits only (source=receipt, creditUsd>0).
 *
 * Page API = scalable (infinite query). Cursor scans ledger rows newest-first;
 * many pages may yield zero receipts — UI keeps fetching until items or exhaust.
 */

import { listClientLedgerEntriesPage } from '@/lib/firebase/payments/listClientLedgerEntries';
import { mapLedgerEntryToPaymentReceived } from '@/lib/firebase/payments/mapLedgerEntryToPaymentReceived';
import { mapPaymentsLoadErrorToMessage } from '@/lib/firebase/payments/mapPaymentsLoadError';
import type {
  ClientPaymentsReceivedPage,
  GetClientPaymentsReceivedResult,
  PaymentReceivedItem,
  PaymentsReceivedPageCursor,
} from '@/lib/firebase/payments/paymentsReceivedTypes';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';

/** Ledger rows scanned per network round-trip. */
export const PAYMENTS_RECEIVED_LEDGER_PAGE_SIZE = 30;

function sortNewestFirst(a: PaymentReceivedItem, b: PaymentReceivedItem): number {
  return (b.date?.getTime() || 0) - (a.date?.getTime() || 0);
}

function dedupeByEntryId(items: PaymentReceivedItem[]): PaymentReceivedItem[] {
  const byId = new Map<string, PaymentReceivedItem>();
  for (const item of items) {
    byId.set(item.entryId || `${item.amountLabel}-${item.subtitle}`, item);
  }
  return [...byId.values()].sort(sortNewestFirst);
}

/**
 * One ledger page → receipt items (may be empty while hasMore is still true).
 */
export async function getClientPaymentsReceivedPage(
  adminId: string,
  clientId: string,
  cursor: PaymentsReceivedPageCursor = null,
  pageSize: number = PAYMENTS_RECEIVED_LEDGER_PAGE_SIZE,
): Promise<ClientPaymentsReceivedPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  const page = await listClientLedgerEntriesPage(aid, cid, cursor, pageSize);
  const items: PaymentReceivedItem[] = [];

  for (const row of page.entries) {
    const mapped = mapLedgerEntryToPaymentReceived(row, String(row.entryId ?? ''));
    if (mapped) items.push(mapped);
  }

  // Page already newest-first; keep stable within-page order.
  return {
    items,
    nextCursor: page.hasMore ? page.lastDoc : null,
    hasMore: page.hasMore,
  };
}

/** Drain all ledger pages (prefer page + infinite query in UI). */
export async function getClientPaymentsReceived(
  adminId: string,
  clientId: string,
): Promise<PaymentReceivedItem[]> {
  const all: PaymentReceivedItem[] = [];
  let cursor: PaymentsReceivedPageCursor = null;
  let hasMore = true;

  while (hasMore) {
    const page = await getClientPaymentsReceivedPage(adminId, clientId, cursor);
    all.push(...page.items);
    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  return dedupeByEntryId(all);
}

export async function getClientPaymentsReceivedSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientPaymentsReceivedResult> {
  try {
    const items = await getClientPaymentsReceived(adminId, clientId);
    return { items, errorMessage: null };
  } catch (error) {
    const message = mapPaymentsLoadErrorToMessage(error);
    console.error('[getClientPaymentsReceived]', error);
    return { items: [], errorMessage: message };
  }
}
