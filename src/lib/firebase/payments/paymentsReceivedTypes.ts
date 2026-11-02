/**
 * Profile → Payments → PAYMENTS RECEIVED.
 * Source: admins/{adminId}/clients/{clientId}/clientLedger
 * Filter: source === 'receipt' && creditUsd > 0
 *
 * Pagination scans ledger pages (newest first); many rows are not receipts.
 */

import type { QueryDocumentSnapshot } from 'firebase/firestore';

export type PaymentReceivedStatus = 'received' | 'cleared';

export type PaymentReceivedItem = {
  entryId: string;
  date: Date | null;
  amountUsd: number;
  /** bankName or "Payment" */
  title: string;
  /** date · docNo · particulars */
  subtitle: string;
  docNo: string;
  bankName: string | null;
  particulars: string;
  receiptUrl: string | null;
  /** UI badge — Received | Cleared */
  status: PaymentReceivedStatus;
  statusLabel: string;
  /** Formatted amount e.g. "USD 8,500" */
  amountLabel: string;
};

/** Firestore cursor over clientLedger (date desc). */
export type PaymentsReceivedPageCursor = QueryDocumentSnapshot | null;

export type ClientPaymentsReceivedPage = {
  items: PaymentReceivedItem[];
  nextCursor: PaymentsReceivedPageCursor;
  hasMore: boolean;
};

export type GetClientPaymentsReceivedResult = {
  items: PaymentReceivedItem[];
  errorMessage: string | null;
};

/** Raw ledger row used by payments mappers (injectable for tests). */
export type ClientLedgerReceiptRow = {
  entryId?: unknown;
  id?: unknown;
  source?: unknown;
  creditUsd?: unknown;
  debitUsd?: unknown;
  balanceUsd?: unknown;
  bankName?: unknown;
  docNo?: unknown;
  particulars?: unknown;
  date?: unknown;
  receiptUrl?: unknown;
  status?: unknown;
  cleared?: unknown;
  customerVisitId?: unknown;
  linkedSaleCancelled?: unknown;
};
