/**
 * Testing helper — Instant Sale vouchers (`confirmationDoc`) for session client.
 * Testing tab only — not used by Trips / Active Trip UI.
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 */

import { collection, getDocs, type DocumentData, type Firestore } from 'firebase/firestore';

import { db as defaultDb } from '@/lib/firebase/firestore';
import { getSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';

export type SaleVoucherRow = {
  saleId: string;
  documentPath: string;
  voucherUrl: string;
  confirmationNo: string | null;
  serviceName: string | null;
  /** Verified via getSaleVoucherPdf(getDoc) — same URL as list scan when present. */
  verifiedVoucherUrl: string | null;
};

export type ClientSaleVouchersReport = {
  adminId: string | null;
  clientId: string | null;
  salesScanned: number;
  vouchersFound: number;
  vouchers: SaleVoucherRow[];
  errorMessage: string | null;
};

function emptyReport(
  errorMessage: string | null = null,
  adminId: string | null = null,
  clientId: string | null = null,
): ClientSaleVouchersReport {
  return {
    adminId,
    clientId,
    salesScanned: 0,
    vouchersFound: 0,
    vouchers: [],
    errorMessage,
  };
}

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

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
 * Scan client sales → rows with non-empty `confirmationDoc` PDF URL.
 * Also re-fetches the first match via `getSaleVoucherPdf` to exercise that API.
 */
export async function testClientSaleVouchers(
  adminId: string,
  clientId: string,
  firestore: Firestore = defaultDb,
): Promise<ClientSaleVouchersReport> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    return emptyReport('adminId and clientId are required');
  }

  try {
    const salesRef = collection(firestore, 'admins', aid, 'clients', cid, 'sales');
    const snap = await getDocs(salesRef);

    const withUrl: { id: string; path: string; data: DocumentData; voucherUrl: string }[] = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const voucherUrl = readString(data.confirmationDoc);
      if (!voucherUrl) {
        continue;
      }
      const saleId = String(data.saleId || data.customerVisitId || docSnap.id).trim();
      withUrl.push({
        id: saleId,
        path: docSnap.ref.path,
        data,
        voucherUrl,
      });
    }

    const vouchers: SaleVoucherRow[] = [];

    for (let i = 0; i < withUrl.length; i += 1) {
      const row = withUrl[i];
      const service = Array.isArray(row.data.serviceModelList)
        ? asRecord(row.data.serviceModelList[0])
        : null;

      let verifiedVoucherUrl: string | null = null;
      if (i === 0) {
        const verified = await getSaleVoucherPdf(aid, cid, row.id);
        verifiedVoucherUrl = verified.voucherUrl;
      }

      vouchers.push({
        saleId: row.id,
        documentPath: row.path,
        voucherUrl: row.voucherUrl,
        confirmationNo: readString(row.data.confirmationNo),
        serviceName: readString(row.data.serviceName) || readString(service?.serviceName),
        verifiedVoucherUrl,
      });
    }

    return {
      adminId: aid,
      clientId: cid,
      salesScanned: snap.size,
      vouchersFound: vouchers.length,
      vouchers,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load sale vouchers';
    console.error('[testClientSaleVouchers]', error);
    return emptyReport(message, aid, cid);
  }
}

export function logClientSaleVouchers(report: ClientSaleVouchersReport): void {
  console.log(
    '[sale-vouchers-test]',
    `scanned=${report.salesScanned}`,
    `withPdf=${report.vouchersFound}`,
    report.errorMessage ? `error=${report.errorMessage}` : '',
  );
  for (const v of report.vouchers) {
    console.log(
      '[sale-vouchers-test]',
      `saleId=${v.saleId}`,
      `service=${v.serviceName ?? '—'}`,
      `url=${v.voucherUrl.slice(0, 80)}…`,
    );
  }
}
