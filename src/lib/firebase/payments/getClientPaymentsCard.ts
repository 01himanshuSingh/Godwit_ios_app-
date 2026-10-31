/**
 * Client Payments card — account-level ledger only (USD).
 *
 * Balance:  admins/{adminId}/clients/{clientId}.clientLedgerBalanceUsd
 * Entries:  admins/{adminId}/clients/{clientId}/clientLedger (orderBy date asc)
 *
 * Prefer latest entry.balanceUsd when present (same as CRM).
 * Ledger-only failure → keep denorm balance (partial UI).
 * Client + ledger both fail → throw (error state, not empty).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore';

import { computePaymentTag, formatAmountDueLabel } from '@/lib/firebase/payments/computePaymentTag';
import { mapPaymentsLoadErrorToMessage } from '@/lib/firebase/payments/mapPaymentsLoadError';
import type {
  ClientLedgerEntry,
  ClientPaymentsCard,
  GetClientPaymentsCardResult,
} from '@/lib/firebase/payments/paymentCardTypes';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readDateKey(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 10);
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      if (Number.isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return null;
    }
  }
  return null;
}

function mapLedgerEntry(id: string, data: DocumentData): ClientLedgerEntry {
  // USD card only — ignore amountNative / other currencies on rows.
  return {
    id,
    dateKey: readDateKey(data.date) || readDateKey(data.createdAt) || readDateKey(data.entryDate),
    balanceUsd: readNumber(data.balanceUsd),
    raw: data as Record<string, unknown>,
  };
}

function latestNumericBalance(statement: ClientLedgerEntry[]): number | null {
  for (let i = statement.length - 1; i >= 0; i -= 1) {
    const v = statement[i]?.balanceUsd;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

/**
 * Load payments card for the signed-in client account (not travellers).
 */
export async function getClientPaymentsCard(
  adminId: string,
  clientId: string,
): Promise<ClientPaymentsCard> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  return withFirestoreRetry('getClientPaymentsCard', async () => {
    let balanceUsd = 0;
    let clientOk = false;
    let ledgerOk = false;
    let clientError: unknown = null;
    let ledgerError: unknown = null;
    let statement: ClientLedgerEntry[] = [];

    try {
      const clientRef = doc(db, 'admins', aid, 'clients', cid);
      const clientSnap = await getDoc(clientRef);
      clientOk = true;
      if (clientSnap.exists()) {
        // Missing / non-number denorm → 0 until a ledger entry overrides.
        balanceUsd = readNumber(clientSnap.data().clientLedgerBalanceUsd) ?? 0;
      }
    } catch (error) {
      clientError = error;
      console.warn('[getClientPaymentsCard] client doc failed:', error);
    }

    try {
      const ledgerRef = collection(db, 'admins', aid, 'clients', cid, 'clientLedger');
      const ledgerSnap = await getDocs(query(ledgerRef, orderBy('date', 'asc')));
      ledgerOk = true;
      statement = ledgerSnap.docs.map((d) => mapLedgerEntry(d.id, d.data()));
    } catch (error) {
      ledgerError = error;
      // Partial UI: keep denorm balance when only the ledger list fails.
      console.warn('[getClientPaymentsCard] clientLedger query failed:', error);
      statement = [];
    }

    if (!clientOk && !ledgerOk) {
      throw clientError ?? ledgerError ?? new Error('Failed to load payments');
    }

    // Prefer latest usable entry balance when CRM denorm is stale / missing.
    const fromLedger = latestNumericBalance(statement);
    if (fromLedger !== null) {
      balanceUsd = fromLedger;
    }

    // Negative zero / float noise.
    balanceUsd = Math.round(balanceUsd * 100) / 100;
    // Avoid -0 display edge.
    if (Object.is(balanceUsd, -0)) balanceUsd = 0;

    const hasLedger = statement.length > 0 || balanceUsd !== 0;
    const { tag, tagLabel } = computePaymentTag(balanceUsd, statement.length > 0);

    return {
      currency: 'USD',
      amount: Math.abs(balanceUsd),
      signedBalance: balanceUsd,
      tag,
      tagLabel,
      amountDueLabel: formatAmountDueLabel(balanceUsd),
      nextPaymentDue: null,
      statement,
      hasLedger,
    };
  });
}

export async function getClientPaymentsCardSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientPaymentsCardResult> {
  try {
    const card = await getClientPaymentsCard(adminId, clientId);
    return { card, errorMessage: null };
  } catch (error) {
    const message = mapPaymentsLoadErrorToMessage(error);
    console.error('[getClientPaymentsCard]', error);
    return { card: null, errorMessage: message };
  }
}

export function formatNextPaymentDueLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const label = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `Next payment due ${label}`;
}
