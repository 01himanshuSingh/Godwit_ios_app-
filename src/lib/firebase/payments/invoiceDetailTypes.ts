/**
 * Profile → Payments → Invoice detail (one sale).
 * Source: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * No per-invoice Paid / Outstanding / Partially paid — not in CRM.
 */

export type InvoiceLineItem = {
  description: string;
  amount: number;
  amountLabel: string;
};

export type ClientInvoiceDetail = {
  saleId: string;
  clientId: string;
  /** walkIn.invoiceNo or saleId */
  invoiceNumber: string;
  /** Service-based title — e.g. "Hotel – Aman" */
  title: string;
  clientName: string;
  issueDateKey: string | null;
  /** e.g. "1 September 2026" */
  issueDateLabel: string | null;
  /** Dates only (+ city only when destinationCity is filled) */
  tripReference: string | null;
  currency: string;
  lineItems: InvoiceLineItem[];
  total: number;
  totalLabel: string;
  /** Always null — receipts are ledger credits, not allocated to a sale */
  paid: null;
  outstanding: null;
  /** CRM saleStatus only — not Partially paid / Due / Paid */
  status: 'cancelled' | 'sold';
  /** Always null — hide Partially paid badge */
  statusBadge: null;
  /** No dedicated invoice PDF field in CRM */
  pdfUrl: null;
  /** Trip voucher (confirmationDoc) — not an invoice PDF */
  voucherUrl: string | null;
  documentPath: string;
};

export type GetClientInvoiceResult = {
  invoice: ClientInvoiceDetail | null;
  errorMessage: string | null;
};
