/**
 * Testing helper — first hotel Instant Sale only.
 * Shows COUNTS of confirmation-related fields (not values).
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * Testing tab only — not used by Trips / Active Trip UI.
 *
 * Usage:
 *   const report = await testFirstHotelConfirmationCounts(adminId, clientId);
 *   logHotelConfirmationCounts(report);
 */

import { collection, getDocs, type DocumentData, type Firestore } from 'firebase/firestore';

import { resolveSaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';
import { extractHotelSaleConfirmationDetails } from '@/lib/firebase/sales/hotelServices';
import { db as defaultDb } from '@/lib/firebase/firestore';

export type HotelConfirmationCountReport = {
  foundHotelSale: boolean;
  saleId: string | null;
  documentPath: string | null;
  adminId: string | null;
  clientId: string | null;
  /** How many of the confirmation fields have a non-empty value (0–3). */
  fieldsPresentCount: number;
  /** Always 3: confirmationNo, address, mealPlan. */
  totalChecked: number;
  /** Per-field presence only (1 = present, 0 = missing). */
  counts: {
    confirmationNo: 0 | 1;
    address: 0 | 1;
    mealPlan: 0 | 1;
  };
  /** Where each field resolved from (or none). */
  sources: {
    confirmationNo: string;
    address: string;
    mealPlan: string;
  };
  /** Whether Sale v1 thin service has form sections (usually false). */
  serviceFormSectionsCount: number;
  errorMessage: string | null;
};

function emptyReport(
  errorMessage: string | null = null,
  adminId: string | null = null,
  clientId: string | null = null,
): HotelConfirmationCountReport {
  return {
    foundHotelSale: false,
    saleId: null,
    documentPath: null,
    adminId,
    clientId,
    fieldsPresentCount: 0,
    totalChecked: 3,
    counts: {
      confirmationNo: 0,
      address: 0,
      mealPlan: 0,
    },
    sources: {
      confirmationNo: 'none',
      address: 'none',
      mealPlan: 'none',
    },
    serviceFormSectionsCount: 0,
    errorMessage,
  };
}

function countServiceFormSections(saleData: DocumentData): number {
  const service = Array.isArray(saleData.serviceModelList) ? saleData.serviceModelList[0] : null;
  if (!service || typeof service !== 'object') {
    return 0;
  }
  const sections =
    (service as DocumentData).additionalFields ||
    (service as DocumentData).additionalProperties ||
    [];
  return Array.isArray(sections) ? sections.length : 0;
}

function isHotelSale(data: DocumentData): boolean {
  const t = resolveSaleServiceType(data);
  return t === 'hotel' || t === 'hotelRoomExtension';
}

/**
 * Load client sales → take FIRST hotel sale → count confirmation-related fields only.
 */
export async function testFirstHotelConfirmationCounts(
  adminId: string,
  clientId: string,
  firestore: Firestore = defaultDb,
): Promise<HotelConfirmationCountReport> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    return emptyReport('adminId and clientId are required');
  }

  try {
    const salesRef = collection(firestore, 'admins', aid, 'clients', cid, 'sales');
    const snap = await getDocs(salesRef);

    let firstHotel: { id: string; path: string; data: DocumentData } | null = null;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (!isHotelSale(data)) {
        continue;
      }
      firstHotel = {
        id: String(data.saleId || data.customerVisitId || docSnap.id).trim(),
        path: docSnap.ref.path,
        data,
      };
      break;
    }

    if (!firstHotel) {
      return emptyReport('No hotel Instant Sale found for this client', aid, cid);
    }

    const conf = extractHotelSaleConfirmationDetails(firstHotel.data);
    const confirmationNo: 0 | 1 = conf.confirmationNo ? 1 : 0;
    const address: 0 | 1 = conf.address ? 1 : 0;
    const mealPlan: 0 | 1 = conf.mealPlan ? 1 : 0;

    return {
      foundHotelSale: true,
      saleId: firstHotel.id,
      documentPath: firstHotel.path,
      adminId: aid,
      clientId: cid,
      fieldsPresentCount: confirmationNo + address + mealPlan,
      totalChecked: 3,
      counts: {
        confirmationNo,
        address,
        mealPlan,
      },
      sources: {
        confirmationNo: conf.confirmationSource,
        address: conf.addressSource,
        mealPlan: conf.mealPlanSource,
      },
      serviceFormSectionsCount: countServiceFormSections(firstHotel.data),
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to test hotel confirmation counts';
    console.error('[testFirstHotelConfirmationCounts]', error);
    return emptyReport(message, aid, cid);
  }
}

/** One-line log helper for Metro / console. */
export function logHotelConfirmationCounts(report: HotelConfirmationCountReport): void {
  if (!report.foundHotelSale) {
    console.log('[hotel-confirmation-test]', report.errorMessage || 'no hotel sale');
    return;
  }
  console.log(
    '[hotel-confirmation-test]',
    `adminId=${report.adminId}`,
    `clientId=${report.clientId}`,
    `saleId=${report.saleId}`,
    `present=${report.fieldsPresentCount}/${report.totalChecked}`,
    `counts=`,
    report.counts,
    `sources=`,
    report.sources,
    `serviceFormSections=${report.serviceFormSectionsCount}`,
  );
}
