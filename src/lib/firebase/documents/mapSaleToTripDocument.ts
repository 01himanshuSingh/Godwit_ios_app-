/**
 * Pure mapper: sale doc → TripDocumentItem (null when no confirmationDoc).
 */

import type { DocumentData } from 'firebase/firestore';

import type { TripDocumentItem } from '@/lib/firebase/documents/tripDocumentTypes';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

function asRecord(value: unknown): DocumentData {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DocumentData) : {};
}

function formatTravelDateLabel(key: string | null): string | null {
  if (!key) return null;
  // YYYY-MM-DD or ISO → en-GB long date
  const d = new Date(key.includes('T') ? key : `${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function mapSaleToTripDocument(
  id: string,
  data: DocumentData,
  documentPath: string,
): TripDocumentItem | null {
  const url = readString(data.confirmationDoc);
  if (!url) return null;

  const walkIn = asRecord(data.walkInModel);
  const service0 =
    Array.isArray(data.serviceModelList) && data.serviceModelList[0]
      ? asRecord(data.serviceModelList[0])
      : {};

  const serviceName = readString(data.serviceName) || readString(service0.serviceName) || null;

  const titleBase =
    readString(data.hotelBrand) ||
    readString(walkIn.hotelBrand) ||
    readString(walkIn.category) ||
    readString(walkIn.route) ||
    serviceName ||
    'Booking';

  const travelDateKey =
    readString(walkIn.travelDateKey) ||
    readString(walkIn.travelDate) ||
    readString(data.travelDateKey) ||
    null;

  const groupLabel =
    readString(data.tripName) ||
    readString(data.destinationName) ||
    readString(walkIn.destinationCity) ||
    readString(data.destinationCity) ||
    readString(walkIn.cityName) ||
    'Trips';

  return {
    saleId: String(data.saleId || data.customerVisitId || id).trim(),
    title: `${titleBase} – Confirmation`,
    url,
    serviceName,
    travelDateKey,
    travelDateLabel: formatTravelDateLabel(travelDateKey),
    groupLabel,
    documentPath,
  };
}
