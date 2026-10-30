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
