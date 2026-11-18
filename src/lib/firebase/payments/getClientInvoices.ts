/**
 * Client invoices from Instant Sales.
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * Page API = scalable (infinite query). Cursor advances over sales by documentId.
 * Status (Partially paid / Due / Paid) is not in CRM — omitted for now.
 */

import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type Query,
} from 'firebase/firestore';

import { mapSaleToInvoiceItem } from '@/lib/firebase/payments/mapSaleToInvoiceItem';
import type {
  ClientInvoiceItem,
  ClientInvoicesPage,
  GetClientInvoicesResult,
  InvoicesPageCursor,
} from '@/lib/firebase/payments/invoiceTypes';
import { mapPaymentsLoadErrorToMessage } from '@/lib/firebase/payments/mapPaymentsLoadError';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

/** Sales scanned per network round-trip. */
export const INVOICES_SALES_PAGE_SIZE = 15;

function sortIssuedDesc(a: ClientInvoiceItem, b: ClientInvoiceItem): number {
  return String(b.issuedAtKey || '').localeCompare(String(a.issuedAtKey || ''));
}

/**
 * One sales page → invoice rows for the Payments Invoices tab.
 */
export async function getClientInvoicesPage(
  adminId: string,
  clientId: string,
  cursor: InvoicesPageCursor = null,
  pageSize: number = INVOICES_SALES_PAGE_SIZE,
): Promise<ClientInvoicesPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  return withFirestoreRetry('getClientInvoicesPage', async () => {
    const salesRef = collection(db, 'admins', aid, 'clients', cid, 'sales');
    const q: Query<DocumentData> = cursor
      ? query(salesRef, orderBy(documentId()), startAfter(cursor), limit(pageSize))
      : query(salesRef, orderBy(documentId()), limit(pageSize));

    const snap = await getDocs(q);
    const invoices: ClientInvoiceItem[] = [];

    for (const d of snap.docs) {
      invoices.push(mapSaleToInvoiceItem(d.id, d.data(), d.ref.path));
    }

    invoices.sort(sortIssuedDesc);

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length === pageSize;

    return {
      invoices,
      nextCursor: hasMore ? last : null,
      hasMore,
    };
  });
}

/** Drain all sales pages (prefer page + infinite query in UI). */
export async function getClientInvoices(
  adminId: string,
  clientId: string,
): Promise<ClientInvoiceItem[]> {
  const all: ClientInvoiceItem[] = [];
  let cursor: InvoicesPageCursor = null;
  let hasMore = true;

  while (hasMore) {
    const page = await getClientInvoicesPage(adminId, clientId, cursor);
    all.push(...page.invoices);
    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  return all.sort(sortIssuedDesc);
}

export async function getClientInvoicesSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientInvoicesResult> {
  try {
    const invoices = await getClientInvoices(adminId, clientId);
    return { invoices, errorMessage: null };
  } catch (error) {
    const message = mapPaymentsLoadErrorToMessage(error);
    console.error('[getClientInvoices]', error);
    return { invoices: [], errorMessage: message };
  }
}
