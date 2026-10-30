/**
 * Home → Payments spotlight (due or credit) under current trip.
 * Source: same client ledger as Profile → Payments (getClientPaymentsCard).
 */

export type HomePaymentsSpotlightMode = 'due' | 'credit';

export type HomePaymentsDueLine = {
  currency: string;
  /** Absolute amount */
  amount: number;
  /** e.g. "USD 31,700" | "USD 820 credit" */
  amountLabel: string;
};

export type HomePaymentsDueCard = {
  mode: HomePaymentsSpotlightMode;
  /** PAYMENTS DUE | CREDIT WITH GODWIT */
  sectionLabel: string;
  lines: HomePaymentsDueLine[];
};

export type GetHomePaymentsDueResult = {
  card: HomePaymentsDueCard | null;
  errorMessage: string | null;
};
