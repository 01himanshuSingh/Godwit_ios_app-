/**
 * Testing helper — first hotel Instant Sale for a client.
 * Shows hotel name + room type (values) on the Testing tab only.
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 * Room: walkInModel.route (then roomType fallbacks) via extractHotelSaleRoomType
 *
 * Not used by Trips / Active Trip UI.
 */

import { collection, getDocs, type DocumentData, type Firestore } from 'firebase/firestore';

import { resolveSaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';
import { extractHotelSaleRoomType } from '@/lib/firebase/sales/hotelServices';
import { db as defaultDb } from '@/lib/firebase/firestore';

export type HotelRoomTypeTestReport = {
  foundHotelSale: boolean;
  adminId: string | null;
  clientId: string | null;
  saleId: string | null;
  documentPath: string | null;
  hotelName: string | null;
  roomType: string | null;
  roomTypes: string[];
  roomSource: string;
  errorMessage: string | null;
};

function emptyReport(
  errorMessage: string | null = null,
  adminId: string | null = null,
  clientId: string | null = null,
): HotelRoomTypeTestReport {
  return {
    foundHotelSale: false,
    adminId,
    clientId,
    saleId: null,
    documentPath: null,
    hotelName: null,
    roomType: null,
    roomTypes: [],
    roomSource: 'none',
    errorMessage,
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const t = value.trim();
  return t.length ? t : null;
}

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

function isHotelSale(data: DocumentData): boolean {
  const t = resolveSaleServiceType(data);
  return t === 'hotel' || t === 'hotelRoomExtension';
}

/** Testing-only hotel name resolve (does not touch Active Trip mappers). */
function readHotelName(saleData: DocumentData): string | null {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  return (
    readString(walkIn.nameOfHotel) ||
    readString(walkIn.hotelBrand) ||
    readString(walkIn.customHotelBrand) ||
    readString(walkIn.hotelAirlines) ||
    readString(saleData.hotelBrand) ||
    readString(saleData.serviceName) ||
    readString(saleData.preferredPartnershipName) ||
    null
  );
}

/**
 * Load client sales → first hotel sale → hotel name + room type.
 */
export async function testFirstHotelRoomType(
  adminId: string,
  clientId: string,
  firestore: Firestore = defaultDb,
): Promise<HotelRoomTypeTestReport> {
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

    const room = extractHotelSaleRoomType(firstHotel.data);

    return {
      foundHotelSale: true,
      adminId: aid,
      clientId: cid,
      saleId: firstHotel.id,
      documentPath: firstHotel.path,
      hotelName: readHotelName(firstHotel.data),
      roomType: room.roomType,
      roomTypes: room.roomTypes,
      roomSource: room.source,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load hotel room type test';
    console.error('[testFirstHotelRoomType]', error);
    return emptyReport(message, aid, cid);
  }
}

export function logHotelRoomTypeTest(report: HotelRoomTypeTestReport): void {
  if (!report.foundHotelSale) {
    console.log('[hotel-room-type-test]', report.errorMessage || 'no hotel sale');
    return;
  }
  console.log(
    '[hotel-room-type-test]',
    `hotel=${report.hotelName ?? '—'}`,
    `room=${report.roomType ?? '—'}`,
    `source=${report.roomSource}`,
    `saleId=${report.saleId}`,
  );
}
