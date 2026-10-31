/**
 * Client invoices from Instant Sales.
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * Status (Partially paid / Due / Paid) is not in CRM — omitted for now.
 */

import { collection, getDocs, type DocumentData } from 'firebase/firestore';

import { mapSaleToInvoiceItem } from '@/lib/firebase/payments/mapSaleToInvoiceItem';
import type {
  ClientInvoiceItem,
  GetClientInvoicesResult,
} from '@/lib/firebase/payments/invoiceTypes';
import { mapPaymentsLoadErrorToMessage } from '@/lib/firebase/payments/mapPaymentsLoadError';
import { PaymentsScopeError } from '@/lib/firebase/payments/PaymentsScopeError';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

function sortIssuedDesc(a: ClientInvoiceItem, b: ClientInvoiceItem): number {
  return String(b.issuedAtKey || '').localeCompare(String(a.issuedAtKey || ''));
}

/**
 * List sales as invoice rows for the Payments screen.
 */
export async function getClientInvoices(
  adminId: string,
  clientId: string,
): Promise<ClientInvoiceItem[]> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new PaymentsScopeError();
  }

  return withFirestoreRetry('getClientInvoices', async () => {
    const salesRef = collection(db, 'admins', aid, 'clients', cid, 'sales');
    const snap = await getDocs(salesRef);

    const invoices: ClientInvoiceItem[] = [];
    for (const d of snap.docs) {
      const data = d.data() as DocumentData;
      invoices.push(mapSaleToInvoiceItem(d.id, data, d.ref.path));
    }

    return invoices.sort(sortIssuedDesc);
  });
}

export async function getClientInvoicesSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientInvoicesResult> {
  try {
    const invoices = await getClientInvoices(adminId, clientId);
    return { invoices, errorMessage: null };
  } catch (error) {
    const message = mapPaymentsLoadErrorToMessage(error);
    console.error('[getClientInvoices]', error);
    return { invoices: [], errorMessage: message };
  }
}
