/**
 * Shared clientLedger list — amount-due + payments received.
 * Path: admins/{adminId}/clients/{clientId}/clientLedger
 *
 * Full list (asc)  → balance / statement
 * Page list (desc) → payments-received infinite query
 */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { ClientLedgerReceiptRow } from '@/lib/firebase/payments/paymentsReceivedTypes';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

function mapDocToReceiptRow(d: QueryDocumentSnapshot): ClientLedgerReceiptRow {
  const data = d.data() as DocumentData;
  return {
    entryId: d.id,
    id: d.id,
    source: data.source,
    creditUsd: data.creditUsd,
    bankName: data.bankName,
    docNo: data.docNo,
    particulars: data.particulars,
    date: data.date ?? data.createdAt ?? data.entryDate,
    receiptUrl: data.receiptUrl,
    status: data.status,
    cleared: data.cleared,
    ...data,
  };
}

/**
 * All ledger docs for a client (date asc). Used by amount-due / statement.
 */
export async function listClientLedgerEntries(
  adminId: string,
  clientId: string,
): Promise<ClientLedgerReceiptRow[]> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  return withFirestoreRetry('listClientLedgerEntries', async () => {
    const ledgerRef = collection(db, 'admins', aid, 'clients', cid, 'clientLedger');
    const snap = await getDocs(query(ledgerRef, orderBy('date', 'asc')));
    return snap.docs.map(mapDocToReceiptRow);
  });
}

export type ClientLedgerEntriesPage = {
  entries: ClientLedgerReceiptRow[];
  /** Last Firestore doc in this page (for startAfter). */
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
};

/** Ledger entries scanned per payments-received page. */
export const LEDGER_RECEIPTS_PAGE_SIZE = 30;

/**
 * One ledger page, newest first — cursor advances over all entries (not only receipts).
 */
export async function listClientLedgerEntriesPage(
  adminId: string,
  clientId: string,
  cursor: QueryDocumentSnapshot | null = null,
  pageSize: number = LEDGER_RECEIPTS_PAGE_SIZE,
): Promise<ClientLedgerEntriesPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  return withFirestoreRetry('listClientLedgerEntriesPage', async () => {
    const ledgerRef = collection(db, 'admins', aid, 'clients', cid, 'clientLedger');
    const q: Query<DocumentData> = cursor
      ? query(ledgerRef, orderBy('date', 'desc'), startAfter(cursor), limit(pageSize))
      : query(ledgerRef, orderBy('date', 'desc'), limit(pageSize));

    const snap = await getDocs(q);
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null;
    const hasMore = snap.docs.length === pageSize;

    return {
      entries: snap.docs.map(mapDocToReceiptRow),
      lastDoc,
      hasMore,
    };
  });
}
