/**
 * Pure tag rules from this client’s signed USD balance + ledger existence.
 *
 *   > 0  → due
 *   < 0  → credit
 *   = 0 + entries → settled
 *   else → none
 */

import type { PaymentTag } from '@/lib/firebase/payments/paymentCardTypes';

export function computePaymentTag(
  signedBalance: number,
  hasEntries: boolean,
): { tag: PaymentTag; tagLabel: string } {
  if (signedBalance > 0) {
    return { tag: 'due', tagLabel: 'Due' };
  }
  if (signedBalance < 0) {
    return { tag: 'credit', tagLabel: 'Credit' };
  }
  if (hasEntries) {
    return { tag: 'settled', tagLabel: 'Settled' };
  }
  return { tag: 'none', tagLabel: '' };
}

export function formatAmountDueLabel(signedBalance: number): string {
  const abs = Math.abs(signedBalance);
  const formatted = abs.toLocaleString('en-US');
  if (signedBalance > 0) return `USD ${formatted}`;
  if (signedBalance < 0) return `USD ${formatted} credit`;
  return 'USD 0';
}
