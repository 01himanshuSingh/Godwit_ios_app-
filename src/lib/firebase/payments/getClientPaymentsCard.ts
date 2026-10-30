/**
 * Client Payments card — account-level ledger only.
 *
 * Balance:  admins/{adminId}/clients/{clientId}.clientLedgerBalanceUsd
 * Entries:  admins/{adminId}/clients/{clientId}/clientLedger (orderBy date asc)
 *
 * Prefer latest entry.balanceUsd when present (same as CRM).
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
import type {
  ClientLedgerEntry,
  ClientPaymentsCard,
  GetClientPaymentsCardResult,
} from '@/lib/firebase/payments/paymentCardTypes';
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
  return {
    id,
    dateKey: readDateKey(data.date) || readDateKey(data.createdAt) || readDateKey(data.entryDate),
    balanceUsd: readNumber(data.balanceUsd),
    raw: data as Record<string, unknown>,
  };
}

function emptyCard(): ClientPaymentsCard {
  return {
    currency: 'USD',
    amount: 0,
    signedBalance: 0,
    tag: 'none',
    tagLabel: '',
    amountDueLabel: 'USD 0',
    nextPaymentDue: null,
    statement: [],
    hasLedger: false,
  };
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
  if (!aid || !cid) return emptyCard();

  return withFirestoreRetry('getClientPaymentsCard', async () => {
    const clientRef = doc(db, 'admins', aid, 'clients', cid);
    const clientSnap = await getDoc(clientRef);

    let balanceUsd = 0;
    if (clientSnap.exists()) {
      balanceUsd = readNumber(clientSnap.data().clientLedgerBalanceUsd) ?? 0;
    }

    let statement: ClientLedgerEntry[] = [];
    try {
      const ledgerRef = collection(db, 'admins', aid, 'clients', cid, 'clientLedger');
      const ledgerSnap = await getDocs(query(ledgerRef, orderBy('date', 'asc')));
      statement = ledgerSnap.docs.map((d) => mapLedgerEntry(d.id, d.data()));
    } catch (error) {
      // Missing index / empty / permission — keep denormalized balance.
      console.warn('[getClientPaymentsCard] clientLedger query failed:', error);
      statement = [];
    }

    // Prefer latest entry balance when CRM denorm is stale.
    if (statement.length) {
      const latest = statement[statement.length - 1];
      if (typeof latest.balanceUsd === 'number') {
        balanceUsd = latest.balanceUsd;
      }
    }

    balanceUsd = Math.round(balanceUsd * 100) / 100;
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
    const message = error instanceof Error ? error.message : 'Failed to load payments';
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
