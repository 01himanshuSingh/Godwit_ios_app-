/**
 * Single invoice (sale) for Payments → Invoice detail.
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 */

import { doc, getDoc, type DocumentData } from 'firebase/firestore';

import type { GetClientInvoiceResult } from '@/lib/firebase/payments/invoiceDetailTypes';
import { mapSaleToInvoiceDetail } from '@/lib/firebase/payments/mapSaleToInvoiceDetail';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

async function loadClientDisplayName(adminId: string, clientId: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'admins', adminId, 'clients', clientId));
    if (!snap.exists()) return '';
    const data = snap.data() as DocumentData;
    return readString(data.name) || readString(data.fullName) || readString(data.clientName) || '';
  } catch {
    return '';
  }
}

/**
 * Load one sale as invoice detail. Fills clientName from client doc when sale lacks it.
 */
export async function getClientInvoice(adminId: string, clientId: string, saleId: string) {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) return null;

  return withFirestoreRetry('getClientInvoice', async () => {
    const ref = doc(db, 'admins', aid, 'clients', cid, 'sales', sid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as DocumentData;
    const walkIn =
      data.walkInModel && typeof data.walkInModel === 'object' && !Array.isArray(data.walkInModel)
        ? (data.walkInModel as DocumentData)
        : {};
    const hasName = Boolean(readString(data.clientName) || readString(walkIn.clientName));
    const clientNameFallback = hasName ? '' : await loadClientDisplayName(aid, cid);

    return mapSaleToInvoiceDetail(sid, data, cid, ref.path, clientNameFallback);
  });
}

export async function getClientInvoiceSafe(
  adminId: string,
  clientId: string,
  saleId: string,
): Promise<GetClientInvoiceResult> {
  try {
    const invoice = await getClientInvoice(adminId, clientId, saleId);
    if (!invoice) {
      return { invoice: null, errorMessage: 'Invoice not found' };
    }
    return { invoice, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load invoice';
    console.error('[getClientInvoice]', error);
    return { invoice: null, errorMessage: message };
  }
}
