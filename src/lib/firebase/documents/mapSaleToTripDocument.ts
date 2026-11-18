/**
 * Pure mapper: sale doc → TripDocumentItem (null when no confirmationDoc).
 * Badge / format / meta derived only from CRM fields + URL suffix.
 */

import type { DocumentData } from 'firebase/firestore';

import type {
  TripDocumentIconKind,
  TripDocumentItem,
} from '@/lib/firebase/documents/tripDocumentTypes';

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
  const d = new Date(key.includes('T') ? key : `${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatFromUrl(url: string): string | null {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.pdf')) return 'PDF';
  if (path.endsWith('.pkpass')) return 'PKPASS';
  if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'IMAGE';
  return null;
}

function serviceBadge(serviceName: string | null): {
  badgeLabel: string | null;
  iconKind: TripDocumentIconKind;
} {
  const s = (serviceName || '').toLowerCase();
  if (!s) return { badgeLabel: null, iconKind: 'file' };
  if (
    s.includes('hotel') ||
    s.includes('stay') ||
    s.includes('resort') ||
    s.includes('villa') ||
    s.includes('accommodation')
  ) {
    return { badgeLabel: 'STAY', iconKind: 'stay' };
  }
  if (
    s.includes('flight') ||
    s.includes('air') ||
    s.includes('airline') ||
    s.includes('aviation')
  ) {
    return { badgeLabel: 'FLIGHT', iconKind: 'flight' };
  }
  if (s.includes('tour') || s.includes('experience') || s.includes('transfer')) {
    return { badgeLabel: 'TOUR', iconKind: 'tour' };
  }
  if (s.includes('yacht') || s.includes('boat')) {
    return { badgeLabel: 'YACHT', iconKind: 'file' };
  }
  if (s.includes('chauffeur') || s.includes('car')) {
    return { badgeLabel: 'GROUND', iconKind: 'file' };
  }
  // Short CRM label as badge when we recognise nothing specific.
  const short = serviceName!.trim().toUpperCase();
  return {
    badgeLabel: short.length <= 12 ? short : short.slice(0, 12),
    iconKind: 'file',
  };
}

function buildMetaLine(dateLabel: string | null, formatLabel: string | null): string | null {
  if (dateLabel && formatLabel) return `${dateLabel} · ${formatLabel}`;
  return dateLabel || formatLabel || null;
}

export function mapSaleToTripDocument(
  id: string,
  data: DocumentData,
  documentPath: string,
): TripDocumentItem | null {
  if (data.saleStatus === false || data.status === false) return null;

  const url = readString(data.confirmationDoc);
  if (!url) return null;

  const walkIn = asRecord(data.walkInModel);
  const service0 =
    Array.isArray(data.serviceModelList) && data.serviceModelList[0]
      ? asRecord(data.serviceModelList[0])
      : {};

  const saleId = String(data.saleId || data.customerVisitId || id).trim();
  const serviceName = readString(data.serviceName) || readString(service0.serviceName) || null;

  const titleBase =
    readString(data.hotelBrand) ||
    readString(walkIn.hotelBrand) ||
    readString(walkIn.category) ||
    readString(walkIn.route) ||
    serviceName ||
    saleId ||
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

  const travelDateLabel = formatTravelDateLabel(travelDateKey);
  const formatLabel = formatFromUrl(url);
  const { badgeLabel, iconKind } = serviceBadge(serviceName);

  return {
    saleId,
    title: `${titleBase} – Confirmation`,
    url,
    serviceName,
    travelDateKey,
    travelDateLabel,
    groupLabel,
    badgeLabel,
    iconKind,
    formatLabel,
    metaLine: buildMetaLine(travelDateLabel, formatLabel),
    documentPath,
  };
}
