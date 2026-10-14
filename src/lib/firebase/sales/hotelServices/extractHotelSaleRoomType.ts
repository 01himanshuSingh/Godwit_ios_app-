/**
 * Instant Sale hotel selected room type(s).
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 * Primary field: walkInModel.route  (CRM stores selected rooms, comma-joined)
 * Fallback: walkIn.roomType / sale.roomType / form roomType
 *
 * System design:
 *   getDoc(sales/{saleId}) once in getActiveTripDetail
 *     → extractHotelSaleRoomType(saleData)  // sync — no 2nd fetch
 *     → mapHotelDetail DETAILS → ROOM
 *
 * Prefer the sync extract. Use getHotelSaleRoomType only for standalone tests.
 */

import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore';

import { db as defaultDb } from '@/lib/firebase/firestore';

export type ExtractedHotelSaleRoomType = {
  /** Display line for DETAILS → ROOM (comma-joined if multiple) */
  roomType: string | null;
  /** Split when multiple rooms were selected */
  roomTypes: string[];
  source: 'walkIn.route' | 'walkIn.roomType' | 'sale.roomType' | 'serviceForm' | 'none';
};

export type HotelSaleRoomTypeResult = ExtractedHotelSaleRoomType & {
  saleId: string;
  errorMessage: string | null;
};

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const t = value.trim();
  return t.length ? t : null;
}

function findServiceFormField(
  service: DocumentData | null | undefined,
  fieldKey: string,
): string | null {
  if (!service) {
    return null;
  }
  const sections =
    (service.additionalFields as unknown[]) || (service.additionalProperties as unknown[]) || [];
  if (!Array.isArray(sections)) {
    return null;
  }
  for (const section of sections) {
    const sec = asRecord(section);
    const fields = Array.isArray(sec?.fields) ? sec.fields : [];
    for (const field of fields) {
      const f = asRecord(field);
      if (f && String(f.fieldKey || '') === fieldKey) {
        const v = readString(f.value) ?? readString(f.dateValue) ?? readString(f.textValue);
        if (v) {
          return v;
        }
      }
    }
  }
  return null;
}

function splitRoomTypes(roomType: string | null): string[] {
  if (!roomType) {
    return [];
  }
  return roomType
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Core extract — pass Instant Sale doc already loaded in getActiveTripDetail.
 */
export function extractHotelSaleRoomType(saleData: DocumentData): ExtractedHotelSaleRoomType {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;

  // Instant Sale hotel: selected room type(s) saved on walkIn.route
  const fromRoute = readString(walkIn.route);
  if (fromRoute) {
    return {
      roomType: fromRoute,
      roomTypes: splitRoomTypes(fromRoute),
      source: 'walkIn.route',
    };
  }

  const fromWalkInRoom =
    readString(walkIn.roomType) || readString(walkIn.roomName) || readString(walkIn.room);
  if (fromWalkInRoom) {
    const view = readString(walkIn.roomView) || readString(walkIn.view);
    const line =
      view && !fromWalkInRoom.toLowerCase().includes(view.toLowerCase())
        ? `${fromWalkInRoom}, ${view}`
        : fromWalkInRoom;
    return {
      roomType: line,
      roomTypes: splitRoomTypes(line),
      source: 'walkIn.roomType',
    };
  }

  const fromTop = readString(saleData.roomType) || readString(saleData.roomName);
  if (fromTop) {
    return {
      roomType: fromTop,
      roomTypes: splitRoomTypes(fromTop),
      source: 'sale.roomType',
    };
  }

  const fromForm =
    findServiceFormField(service, 'roomType') ||
    findServiceFormField(service, 'roomName') ||
    findServiceFormField(service, 'route');
  if (fromForm) {
    return {
      roomType: fromForm,
      roomTypes: splitRoomTypes(fromForm),
      source: 'serviceForm',
    };
  }

  return { roomType: null, roomTypes: [], source: 'none' };
}

/**
 * Standalone fetch — prefer extractHotelSaleRoomType(saleData) after shared getDoc.
 */
export async function getHotelSaleRoomType(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<HotelSaleRoomTypeResult> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();

  if (!aid || !cid || !sid) {
    return {
      saleId: sid,
      roomType: null,
      roomTypes: [],
      source: 'none',
      errorMessage: 'adminId, clientId and saleId are required',
    };
  }

  try {
    const ref = doc(firestore, 'admins', aid, 'clients', cid, 'sales', sid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        saleId: sid,
        roomType: null,
        roomTypes: [],
        source: 'none',
        errorMessage: 'Sale not found',
      };
    }

    const extracted = extractHotelSaleRoomType(snap.data());
    return {
      saleId: sid,
      ...extracted,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load room type';
    console.error('[getHotelSaleRoomType]', error);
    return {
      saleId: sid,
      roomType: null,
      roomTypes: [],
      source: 'none',
      errorMessage: message,
    };
  }
}
