/**
 * Profile → Payments — client account ledger (not travellers).
 * Paths:
 *   admins/{adminId}/clients/{clientId} → clientLedgerBalanceUsd
 *   admins/{adminId}/clients/{clientId}/clientLedger/{entryId}
 */

export type PaymentTag = 'due' | 'credit' | 'settled' | 'none';

export type ClientLedgerEntry = {
  id: string;
  dateKey: string | null;
  balanceUsd: number | null;
  raw: Record<string, unknown>;
};

export type ClientPaymentsCard = {
  currency: 'USD';
  /** Absolute amount for display (820 when due or credit) */
  amount: number;
  /** +due / -credit / 0 */
  signedBalance: number;
  tag: PaymentTag;
  tagLabel: string;
  /** e.g. "USD 31,700" | "USD 820 credit" | "USD 0" */
  amountDueLabel: string;
  nextPaymentDue: string | null;
  /** Ledger rows for Account statement (date asc) */
  statement: ClientLedgerEntry[];
  hasLedger: boolean;
};

export type GetClientPaymentsCardResult = {
  card: ClientPaymentsCard | null;
  errorMessage: string | null;
};
