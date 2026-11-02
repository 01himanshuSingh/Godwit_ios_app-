/**
 * Credits & refunds for Profile → Payments.
 * Refund credits only (source=refund, creditUsd>0).
 *
 * Page API = scalable (infinite query). Cursor scans ledger rows newest-first.
 */

import type {
  ClientCreditsRefundsPage,
  CreditRefundItem,
  CreditsRefundsPageCursor,
  GetClientCreditsRefundsResult,
} from '@/lib/firebase/payments/creditsRefundsTypes';
import { listClientLedgerEntriesPage } from '@/lib/firebase/payments/listClientLedgerEntries';
import { mapLedgerEntryToCreditRefund } from '@/lib/firebase/payments/mapLedgerEntryToCreditRefund';
import { mapPaymentsLoadErrorToMessage } from '@/lib/firebase/payments/mapPaymentsLoadError';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';

/** Ledger rows scanned per network round-trip. */
export const CREDITS_REFUNDS_LEDGER_PAGE_SIZE = 30;

function sortNewestFirst(a: CreditRefundItem, b: CreditRefundItem): number {
  return (b.date?.getTime() || 0) - (a.date?.getTime() || 0);
}

function dedupeByEntryId(items: CreditRefundItem[]): CreditRefundItem[] {
  const byId = new Map<string, CreditRefundItem>();
  for (const item of items) {
    byId.set(item.entryId || `${item.amountLabel}-${item.subtitle}`, item);
  }
  return [...byId.values()].sort(sortNewestFirst);
}

/**
 * One ledger page → refund items (may be empty while hasMore is still true).
 */
export async function getClientCreditsAndRefundsPage(
  adminId: string,
  clientId: string,
  cursor: CreditsRefundsPageCursor = null,
  pageSize: number = CREDITS_REFUNDS_LEDGER_PAGE_SIZE,
): Promise<ClientCreditsRefundsPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  const page = await listClientLedgerEntriesPage(aid, cid, cursor, pageSize);
  const items: CreditRefundItem[] = [];

  for (const row of page.entries) {
    const mapped = mapLedgerEntryToCreditRefund(row, String(row.entryId ?? ''));
    if (mapped) items.push(mapped);
  }

  return {
    items,
    nextCursor: page.hasMore ? page.lastDoc : null,
    hasMore: page.hasMore,
  };
}

/** Drain all ledger pages (prefer page + infinite query in UI). */
export async function getClientCreditsAndRefunds(
  adminId: string,
  clientId: string,
): Promise<CreditRefundItem[]> {
  const all: CreditRefundItem[] = [];
  let cursor: CreditsRefundsPageCursor = null;
  let hasMore = true;

  while (hasMore) {
    const page = await getClientCreditsAndRefundsPage(adminId, clientId, cursor);
    all.push(...page.items);
    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  return dedupeByEntryId(all);
}

export async function getClientCreditsAndRefundsSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientCreditsRefundsResult> {
  try {
    const items = await getClientCreditsAndRefunds(adminId, clientId);
    return { items, errorMessage: null };
  } catch (error) {
    const message = mapPaymentsLoadErrorToMessage(error);
    console.error('[getClientCreditsAndRefunds]', error);
    return { items: [], errorMessage: message };
  }
}
