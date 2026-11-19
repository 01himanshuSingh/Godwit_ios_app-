/**
 * Trip voucher PDF URL from Instant Sale (`confirmationDoc`).
 * Same for hotel / air / yacht / VIP / any service.
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * Open / download are delegated to `documentFileActions` (in-app viewer).
 */

import { doc, getDoc } from 'firebase/firestore';

import { downloadDocumentFile, openDocumentInApp } from '@/lib/documents/documentFileActions';
import { db } from '@/lib/firebase/firestore';

export type SaleVoucherPdf = {
  voucherUrl: string | null;
  confirmationNo: string | null;
  serviceName: string | null;
};

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/**
 * Load CRM-uploaded voucher / confirmation PDF URL for one sale.
 */
export async function getSaleVoucherPdf(
  adminId: string,
  clientId: string,
  saleId: string,
): Promise<SaleVoucherPdf> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();

  if (!aid || !cid || !sid) {
    return { voucherUrl: null, confirmationNo: null, serviceName: null };
  }

  const ref = doc(db, 'admins', aid, 'clients', cid, 'sales', sid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { voucherUrl: null, confirmationNo: null, serviceName: null };
  }

  const data = snap.data();
  const serviceList0 =
    Array.isArray(data.serviceModelList) && data.serviceModelList[0]
      ? (data.serviceModelList[0] as { serviceName?: unknown })
      : null;

  return {
    voucherUrl: readString(data.confirmationDoc),
    confirmationNo: readString(data.confirmationNo),
    serviceName: readString(data.serviceName) || readString(serviceList0?.serviceName),
  };
}

/** Open voucher / confirmation in the in-app document viewer. */
export async function openSaleVoucherPdf(voucherUrl: string, title = 'Document'): Promise<void> {
  await openDocumentInApp(voucherUrl, title);
}

/** Download voucher then open the native share sheet. */
export async function downloadSaleVoucherPdf(
  voucherUrl: string,
  fileLabel = 'trip-voucher',
): Promise<void> {
  await downloadDocumentFile(voucherUrl, fileLabel);
}
