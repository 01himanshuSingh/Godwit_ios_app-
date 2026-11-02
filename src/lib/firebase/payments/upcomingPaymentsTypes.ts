/**
 * Profile → Payments → UPCOMING PAYMENTS.
 *
 * Account due = client ledger balanceUsd (> 0).
 * Rows = sale debit ledger lines (source=sale) enriched from sales/{saleId}.
 */

export type UpcomingPaymentAccountTag = 'due' | 'credit' | 'settled';

export type UpcomingPaymentRowStatus = 'due' | 'overdue' | 'partial';

export type UpcomingPaymentItem = {
  saleId: string;
  entryId: string;
  title: string;
  subtitle: string;
  billedUsd: number;
  amountLabel: string;
  date: Date | null;
  /** Left column: day number e.g. "15" */
  dayLabel: string | null;
  /** Left column: month abbr e.g. "AUG" */
  monthLabel: string | null;
  status: UpcomingPaymentRowStatus;
  statusLabel: string;
};

export type ClientUpcomingPayments = {
  hasDue: boolean;
  dueUsd: number;
  tag: UpcomingPaymentAccountTag;
  items: UpcomingPaymentItem[];
};

export type GetClientUpcomingPaymentsResult = {
  data: ClientUpcomingPayments | null;
  errorMessage: string | null;
};
