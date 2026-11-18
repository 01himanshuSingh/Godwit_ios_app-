/**
 * Profile → Payments → Invoices list.
 * Source: admins/{adminId}/clients/{clientId}/sales/{saleId}
 * Title is service-based (no destination city).
 */

import type { QueryDocumentSnapshot } from 'firebase/firestore';

export type ClientInvoiceItem = {
  saleId: string;
  /** Service / brand title — e.g. "Hotel – Aman" */
  title: string;
  /** walkIn.invoiceNo or saleId fallback */
  invoiceNo: string;
  issuedAtKey: string | null;
  /** e.g. "Issued 1 Sept 2026" */
  issuedAtLabel: string | null;
  currency: string;
  amount: number;
  /** e.g. "USD 18,500" */
  amountLabel: string;
  documentPath: string;
};

/** Firestore cursor over sales (documentId order). */
export type InvoicesPageCursor = QueryDocumentSnapshot | null;

export type ClientInvoicesPage = {
  invoices: ClientInvoiceItem[];
  nextCursor: InvoicesPageCursor;
  hasMore: boolean;
};

export type GetClientInvoicesResult = {
  invoices: ClientInvoiceItem[];
  errorMessage: string | null;
};
