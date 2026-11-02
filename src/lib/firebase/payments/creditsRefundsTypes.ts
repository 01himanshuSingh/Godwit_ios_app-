/**
 * Profile → Payments → CREDITS AND REFUNDS.
 * Source: admins/{adminId}/clients/{clientId}/clientLedger
 * Filter: source === 'refund' && creditUsd > 0
 *
 * Pagination scans ledger pages (newest first); many rows are not refunds.
 */

import type { QueryDocumentSnapshot } from 'firebase/firestore';

export type CreditRefundStatus = 'refunded' | 'cleared';

export type CreditRefundItem = {
  entryId: string;
  date: Date | null;
  amountUsd: number;
  /** Always "Refund" — CRM has no separate Credit note type. */
  title: string;
  /** date · docNo · particulars */
  subtitle: string;
  docNo: string;
  particulars: string;
  /** Kept for later; UI may hide View proof. */
  receiptUrl: string | null;
  status: CreditRefundStatus;
  statusLabel: string;
  /** e.g. "– USD 4,800" */
  amountLabel: string;
};

export type CreditsRefundsPageCursor = QueryDocumentSnapshot | null;

export type ClientCreditsRefundsPage = {
  items: CreditRefundItem[];
  nextCursor: CreditsRefundsPageCursor;
  hasMore: boolean;
};

export type GetClientCreditsRefundsResult = {
  items: CreditRefundItem[];
  errorMessage: string | null;
};
