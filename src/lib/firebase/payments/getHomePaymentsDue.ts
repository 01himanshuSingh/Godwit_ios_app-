/**
 * Home Payments due — same client ledger fetch as Profile → Payments.
 * Path: admins/{adminId}/clients/{clientId}.clientLedgerBalanceUsd (+ clientLedger)
 */

import { getClientPaymentsCard } from '@/lib/firebase/payments/getClientPaymentsCard';
import type { GetHomePaymentsDueResult } from '@/lib/firebase/payments/homePaymentsDueTypes';
import { mapPaymentsCardToHomeDue } from '@/lib/firebase/payments/mapPaymentsCardToHomeDue';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';

export async function getHomePaymentsDue(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
) {
  const payments = await getClientPaymentsCard(adminId, clientId);
  return mapPaymentsCardToHomeDue(payments);
}

export async function getHomePaymentsDueSafe(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<GetHomePaymentsDueResult> {
  try {
    const card = await getHomePaymentsDue(adminId, clientId);
    return { card, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load payments due';
    console.error('[getHomePaymentsDue]', error);
    return { card: null, errorMessage: message };
  }
}
