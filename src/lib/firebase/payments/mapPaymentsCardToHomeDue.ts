/**
 * Pure: ClientPaymentsCard → HomePaymentsDueCard | null
 * Shows for due (balance > 0) or credit (balance < 0) — same ledger as Profile Payments.
 */

import type {
  HomePaymentsDueCard,
  HomePaymentsDueLine,
} from '@/lib/firebase/payments/homePaymentsDueTypes';
import type { ClientPaymentsCard } from '@/lib/firebase/payments/paymentCardTypes';

function formatLine(currency: string, signedAmount: number): HomePaymentsDueLine {
  const code = (currency || 'USD').toUpperCase();
  const n = Math.abs(signedAmount);
  const formatted = n.toLocaleString('en-US');
  return {
    currency: code,
    amount: n,
    amountLabel: signedAmount < 0 ? `${code} ${formatted} credit` : `${code} ${formatted}`,
  };
}

/**
 * Home payments spotlight from client ledger.
 *   > 0 → PAYMENTS DUE
 *   < 0 → CREDIT WITH GODWIT
 *   = 0 → hide
 */
export function mapPaymentsCardToHomeDue(
  card: ClientPaymentsCard | null,
): HomePaymentsDueCard | null {
  if (!card || card.signedBalance === 0) {
    return null;
  }

  const mode = card.signedBalance > 0 ? 'due' : 'credit';

  return {
    mode,
    sectionLabel: mode === 'due' ? 'PAYMENTS DUE' : 'CREDIT WITH GODWIT',
    lines: [formatLine(card.currency || 'USD', card.signedBalance)],
  };
}
