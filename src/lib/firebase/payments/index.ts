/**
 * Profile Payments — client account ledger + invoices.
 *
 * Ledger:
 *   types  → paymentCardTypes.ts
 *   pure   → computePaymentTag.ts
 *   fetch  → getClientPaymentsCard.ts
 *
 * Home payments due (spotlight):
 *   types  → homePaymentsDueTypes.ts
 *   map    → mapPaymentsCardToHomeDue.ts
 *   fetch  → getHomePaymentsDue.ts
 *
 * Invoices list (sales):
 *   types  → invoiceTypes.ts
 *   map    → mapSaleToInvoiceItem.ts
 *   fetch  → getClientInvoices.ts
 *
 * Invoice detail (one sale):
 *   types  → invoiceDetailTypes.ts
 *   map    → mapSaleToInvoiceDetail.ts
 *   fetch  → getClientInvoice.ts
 *
 * Payments received (ledger receipts):
 *   types  → paymentsReceivedTypes.ts
 *   pure   → mapLedgerEntryToPaymentReceived.ts
 *   list   → listClientLedgerEntries.ts
 *   fetch  → getClientPaymentsReceived.ts
 *
 * Credits & refunds (ledger refunds):
 *   types  → creditsRefundsTypes.ts
 *   pure   → mapLedgerEntryToCreditRefund.ts
 *   fetch  → getClientCreditsAndRefunds.ts
 *
 * Upcoming payments (due balance + sale debits):
 *   types  → upcomingPaymentsTypes.ts
 *   sale   → getClientSale.ts
 *   pure   → mapSaleDebitToUpcomingPayment.ts
 *   fetch  → getClientUpcomingPayments.ts
 */

export type {
  PaymentTag,
  ClientLedgerEntry,
  ClientPaymentsCard,
  GetClientPaymentsCardResult,
} from './paymentCardTypes';

export { computePaymentTag, formatAmountDueLabel } from './computePaymentTag';

export {
  getClientPaymentsCard,
  getClientPaymentsCardSafe,
  formatNextPaymentDueLabel,
} from './getClientPaymentsCard';

export { PaymentsScopeError } from './PaymentsScopeError';
export {
  classifyPaymentsLoadError,
  mapPaymentsLoadErrorToMessage,
  type PaymentsLoadErrorKind,
} from './mapPaymentsLoadError';

export type {
  HomePaymentsSpotlightMode,
  HomePaymentsDueLine,
  HomePaymentsDueCard,
  GetHomePaymentsDueResult,
} from './homePaymentsDueTypes';

export { mapPaymentsCardToHomeDue } from './mapPaymentsCardToHomeDue';

export { getHomePaymentsDue, getHomePaymentsDueSafe } from './getHomePaymentsDue';

export type { ClientInvoiceItem, GetClientInvoicesResult } from './invoiceTypes';

export { invoiceTitle, mapSaleToInvoiceItem } from './mapSaleToInvoiceItem';

export { getClientInvoices, getClientInvoicesSafe } from './getClientInvoices';

export type {
  InvoiceLineItem,
  ClientInvoiceDetail,
  GetClientInvoiceResult,
} from './invoiceDetailTypes';

export {
  saleAmount,
  tripReferenceFromSale,
  mapSaleToInvoiceDetail,
} from './mapSaleToInvoiceDetail';

export { getClientInvoice, getClientInvoiceSafe } from './getClientInvoice';

export type {
  PaymentReceivedStatus,
  PaymentReceivedItem,
  PaymentsReceivedPageCursor,
  ClientPaymentsReceivedPage,
  GetClientPaymentsReceivedResult,
  ClientLedgerReceiptRow,
} from './paymentsReceivedTypes';

export {
  mapLedgerEntryToPaymentReceived,
  mapLedgerEntriesToPaymentsReceived,
} from './mapLedgerEntryToPaymentReceived';

export {
  listClientLedgerEntries,
  listClientLedgerEntriesPage,
  LEDGER_RECEIPTS_PAGE_SIZE,
  type ClientLedgerEntriesPage,
} from './listClientLedgerEntries';

export {
  getClientPaymentsReceivedPage,
  getClientPaymentsReceived,
  getClientPaymentsReceivedSafe,
  PAYMENTS_RECEIVED_LEDGER_PAGE_SIZE,
} from './getClientPaymentsReceived';

export type {
  CreditRefundStatus,
  CreditRefundItem,
  CreditsRefundsPageCursor,
  ClientCreditsRefundsPage,
  GetClientCreditsRefundsResult,
} from './creditsRefundsTypes';

export {
  mapLedgerEntryToCreditRefund,
  mapLedgerEntriesToCreditsRefunds,
} from './mapLedgerEntryToCreditRefund';

export {
  getClientCreditsAndRefundsPage,
  getClientCreditsAndRefunds,
  getClientCreditsAndRefundsSafe,
  CREDITS_REFUNDS_LEDGER_PAGE_SIZE,
} from './getClientCreditsAndRefunds';

export type {
  UpcomingPaymentAccountTag,
  UpcomingPaymentRowStatus,
  UpcomingPaymentItem,
  ClientUpcomingPayments,
  GetClientUpcomingPaymentsResult,
} from './upcomingPaymentsTypes';

export { getClientSale } from './getClientSale';

export {
  isSaleDebitLedgerRow,
  mapSaleDebitToUpcomingPayment,
} from './mapSaleDebitToUpcomingPayment';

export {
  getClientUpcomingPayments,
  getClientUpcomingPaymentsSafe,
  type UpcomingPaymentsDeps,
} from './getClientUpcomingPayments';
