/**
 * Instant Sale Airport VIP Meet → Active Trip DETAILS.
 *
 * UI mock:
 *   AIRPORT / SERVICE / TIME / INCLUDED / TRAVELLERS
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * Instant Sale VIP form → walkInModel:
 *   destinationCity  → AIRPORT (city; no terminal field today)
 *   serviceType      → SERVICE (e.g. Meet & assist / arrival)
 *   travelDate       → TIME (date only; no clock time on Instant Sale)
 *   route            → INCLUDED  ← labeled "VIP Description" in CRM UI
 *   category         → brand (optional, not on mock card)
 *   travellers[]     → TRAVELLERS
 *
 * INCLUDED display: split VIP description on commas / newlines / · → "A · B · C"
 *
 * System design:
 *   getDoc(sales/{saleId}) once → mapVipDetail / extractVipSaleDetails(saleData)
 */

import type { DocumentData } from 'firebase/firestore';

import type { DetailRow } from '@/lib/firebase/sales/activeTripDetailTypes';

export type ExtractedVipSaleDetails = {
  airport: string | null;
  service: string | null;
  time: string | null;
  /** Formatted for INCLUDED row (middle dots) */
  included: string | null;
  /** Raw VIP Description from walkIn.route */
  vipDescription: string | null;
  travellers: string | null;
  detailRows: DetailRow[];
  missingForMock: string[];
};

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

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  const sec =
    (value as { seconds?: unknown })?.seconds ?? (value as { _seconds?: unknown })?._seconds;
  if (typeof sec === 'number' && Number.isFinite(sec)) {
    return new Date(sec * 1000);
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTimeLabel(value: unknown): string | null {
  const d = toDate(value);
  if (!d) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const h = d.getHours();
  const m = d.getMinutes();
  // Instant Sale VIP is date-only → usually midnight; skip 00:00
  if (h === 0 && m === 0) {
    return datePart;
  }
  return `${datePart}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTerminal(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  return raw.startsWith('Terminal') ? raw : `Terminal ${raw}`;
}

/** VIP Description → "Jetway greeting · Fast-track immigration · …" */
export function formatVipIncludedLine(raw: string | null): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const parts = raw
    .split(/[\n;|]+|\s*[·•]\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) {
    return null;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return parts.join(' · ');
}

function travellerLine(data: DocumentData): string | null {
  if (Array.isArray(data.travellers) && data.travellers.length) {
    const names = data.travellers
      .map((t: DocumentData) => String(t?.name || '').trim())
      .filter(Boolean);
    return names.length ? names.join(', ') : null;
  }
  const walkIn = asRecord(data.walkInModel) ?? {};
  if (Array.isArray(walkIn.guestNames)) {
    const names = walkIn.guestNames.map((n) => String(n || '').trim()).filter(Boolean);
    return names.length ? names.join(', ') : null;
  }
  return null;
}

function pushRow(rows: DetailRow[], label: string, value: string | null) {
  if (value?.trim()) {
    rows.push({ label, value: value.trim(), kind: 'text' });
  }
}

/**
 * Pass Instant Sale VIP sale doc (already loaded).
 */
export function extractVipSaleDetails(saleData: DocumentData): ExtractedVipSaleDetails {
  const walkIn = asRecord(saleData.walkInModel) ?? {};

  // AIRPORT — Instant Sale "City Name" (+ terminal when present)
  const city =
    readString(walkIn.destinationCity) ||
    readString(walkIn.airportName) ||
    readString(walkIn.airport) ||
    readString(walkIn.cityName);
  const terminal = formatTerminal(
    readString(walkIn.terminal) ||
      readString(walkIn.arrivalTerminal) ||
      readString(walkIn.departureTerminal),
  );
  const airport = [city, terminal].filter(Boolean).join(', ') || city;

  // SERVICE — Instant Sale "Service Type" (+ brand if useful)
  const serviceType =
    readString(walkIn.serviceType) ||
    readString(walkIn.vipServiceDescription) ||
    readString(walkIn.description);
  const brand = readString(walkIn.category);
  const service =
    serviceType && brand && !serviceType.toLowerCase().includes(brand.toLowerCase())
      ? `${serviceType}, ${brand}`
      : serviceType || brand || 'Meet & assist';

  // TIME — Instant Sale "Service Date"
  const time = formatTimeLabel(walkIn.travelDate ?? walkIn.serviceDateTime);

  // INCLUDED — Instant Sale "VIP Description" is stored on walkIn.route
  const vipDescription = readString(walkIn.route);
  const included = formatVipIncludedLine(vipDescription);

  const travellers = travellerLine(saleData);

  const missingForMock: string[] = [];
  if (!airport) missingForMock.push('destinationCity / airport');
  if (!terminal) missingForMock.push('terminal');
  if (!time) missingForMock.push('travelDate');
  if (!included) missingForMock.push('vipDescription (walkIn.route)');
  if (time && !String(time).includes(':')) missingForMock.push('service clock time');

  const detailRows: DetailRow[] = [];
  pushRow(detailRows, 'AIRPORT', airport);
  pushRow(detailRows, 'SERVICE', service);
  pushRow(detailRows, 'TIME', time);
  pushRow(detailRows, 'INCLUDED', included);
  pushRow(detailRows, 'TRAVELLERS', travellers);

  return {
    airport,
    service,
    time,
    included,
    vipDescription,
    travellers,
    detailRows,
    missingForMock,
  };
}
