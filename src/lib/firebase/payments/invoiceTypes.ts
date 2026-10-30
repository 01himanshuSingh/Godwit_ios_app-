/**
 * Profile → Payments → Invoices list.
 * Source: admins/{adminId}/clients/{clientId}/sales/{saleId}
 * Title is service-based (no destination city).
 */

export type ClientInvoiceItem = {
  saleId: string;
  /** Service / brand title — e.g. "Hotel – Aman" */
  title: string;
  /** walkIn.invoiceNo or saleId fallback */
  invoiceNo: string;
  issuedAtKey: string | null;
  /** e.g. "Issued 1 September 2026" */
  issuedAtLabel: string | null;
  currency: string;
  amount: number;
  /** e.g. "USD 18,500" */
  amountLabel: string;
  documentPath: string;
};

export type GetClientInvoicesResult = {
  invoices: ClientInvoiceItem[];
  errorMessage: string | null;
};
