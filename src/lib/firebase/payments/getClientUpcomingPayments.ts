/**
 * Upcoming payments for Profile → Payments.
 *
 * 1) Resolve signed USD ledger balance (denorm → prefer latest entry).
 * 2) If balanceUsd <= 0 → no upcoming rows (credit / settled).
 * 3) Else map sale-debit ledger lines → optional sale enrichment.
 */

import { doc, getDoc, type DocumentData } from 'firebase/firestore';

import { getClientSale } from '@/lib/firebase/payments/getClientSale';
import { listClientLedgerEntries } from '@/lib/firebase/payments/listClientLedgerEntries';
import {
  isSaleDebitLedgerRow,
  mapSaleDebitToUpcomingPayment,
} from '@/lib/firebase/payments/mapSaleDebitToUpcomingPayment';
import { mapPaymentsLoadErrorToMessage } from '@/lib/firebase/payments/mapPaymentsLoadError';
import type { ClientLedgerReceiptRow } from '@/lib/firebase/payments/paymentsReceivedTypes';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';
import type {
  ClientUpcomingPayments,
  GetClientUpcomingPaymentsResult,
  UpcomingPaymentItem,
} from '@/lib/firebase/payments/upcomingPaymentsTypes';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

export type UpcomingPaymentsDeps = {
  getClient: (adminId: string, clientId: string) => Promise<DocumentData | null>;
  listLedgerEntries: (adminId: string, clientId: string) => Promise<ClientLedgerReceiptRow[]>;
  getSale: (adminId: string, clientId: string, saleId: string) => Promise<DocumentData | null>;
};

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function entryTime(row: ClientLedgerReceiptRow): number {
  const value = row.date;
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toMillis?: () => number }).toMillis === 'function'
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      /* fall through */
    }
  }
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  return 0;
}

function latestBalanceUsd(entries: ClientLedgerReceiptRow[]): number | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => entryTime(a) - entryTime(b));
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const n = readNumber(sorted[i]?.balanceUsd);
    if (n !== null) return n;
  }
  return null;
}

async function defaultGetClient(adminId: string, clientId: string): Promise<DocumentData | null> {
  return withFirestoreRetry('upcomingPayments.getClient', async () => {
    const snap = await getDoc(doc(db, 'admins', adminId, 'clients', clientId));
    return snap.exists() ? snap.data() : null;
  });
}

const defaultDeps: UpcomingPaymentsDeps = {
  getClient: defaultGetClient,
  listLedgerEntries: listClientLedgerEntries,
  getSale: getClientSale,
};

async function loadSalesById(
  adminId: string,
  clientId: string,
  saleIds: string[],
  getSale: UpcomingPaymentsDeps['getSale'],
): Promise<Map<string, DocumentData | null>> {
  const unique = [...new Set(saleIds.map((id) => id.trim()).filter(Boolean))];
  const map = new Map<string, DocumentData | null>();

  // Bounded concurrency — avoid hammering Firestore on large ledgers.
  const chunkSize = 8;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (saleId) => {
        try {
          const sale = await getSale(adminId, clientId, saleId);
          return [saleId, sale] as const;
        } catch (error) {
          console.warn('[getClientUpcomingPayments] sale skipped', saleId, error);
          return [saleId, null] as const;
        }
      }),
    );
    for (const [id, sale] of results) {
      map.set(id, sale);
    }
  }

  return map;
}

/**
 * Build upcoming-payments card model for the signed-in client.
 */
export async function getClientUpcomingPayments(
  adminId: string,
  clientId: string,
  deps: UpcomingPaymentsDeps = defaultDeps,
): Promise<ClientUpcomingPayments> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  const client = await deps.getClient(aid, cid);
  let balanceUsd = readNumber(client?.clientLedgerBalanceUsd) ?? 0;

  const entries = await deps.listLedgerEntries(aid, cid);
  const fromLedger = latestBalanceUsd(entries);
  if (fromLedger !== null) {
    balanceUsd = fromLedger;
  }

  balanceUsd = Math.round(balanceUsd * 100) / 100;
  if (Object.is(balanceUsd, -0)) balanceUsd = 0;

  // Nothing owed → no upcoming payment rows.
  if (balanceUsd <= 0) {
    return {
      hasDue: false,
      dueUsd: 0,
      tag: balanceUsd < 0 ? 'credit' : 'settled',
      items: [],
    };
  }

  const saleDebits = entries.filter(isSaleDebitLedgerRow);
  const saleIds = saleDebits.map((e) => readString(e.customerVisitId));
  const salesById = await loadSalesById(aid, cid, saleIds, deps.getSale);

  const items: UpcomingPaymentItem[] = [];
  for (let i = 0; i < saleDebits.length; i += 1) {
    const row = saleDebits[i]!;
    const saleId = readString(row.customerVisitId);
    const mapped = mapSaleDebitToUpcomingPayment(
      row,
      salesById.get(saleId) ?? null,
      String(row.entryId ?? i),
    );
    if (mapped) items.push(mapped);
  }

  items.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

  return {
    hasDue: true,
    dueUsd: balanceUsd,
    tag: 'due',
    items,
  };
}

function readString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export async function getClientUpcomingPaymentsSafe(
  adminId: string,
  clientId: string,
  deps?: UpcomingPaymentsDeps,
): Promise<GetClientUpcomingPaymentsResult> {
  try {
    const data = await getClientUpcomingPayments(adminId, clientId, deps);
    return { data, errorMessage: null };
  } catch (error) {
    const message = mapPaymentsLoadErrorToMessage(error);
    console.error('[getClientUpcomingPayments]', error);
    return { data: null, errorMessage: message };
  }
}
