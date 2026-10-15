/**
 * Instant Sale Private jet → Active Trip DETAILS.
 *
 * UI rows: CARRIER / AIRCRAFT / ROUTE / TRAVELLERS
 * (No DEPARTS / ARRIVES — Instant Sale stores itinerary on `route`.)
 *
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 *
 * CRM Instant Sale:
 *   walkIn.serviceType → CARRIER (Operator on Private Jet band)
 *   walkIn.category    → AIRCRAFT (Aircraft Type)
 *   walkIn.route       → ROUTE
 *   travellers[]       → TRAVELLERS
 */

import type { DocumentData } from 'firebase/firestore';

import type { DetailRow } from '@/lib/firebase/sales/activeTripDetailTypes';

export type ExtractedPrivateJetSaleDetails = {
  carrier: string | null;
  aircraft: string | null;
  route: string | null;
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

function formatRouteArrow(route: string | null): string | null {
  if (!route) {
    return null;
  }
  return route
    .replace(/\s*→\s*/g, ' → ')
    .replace(/\s*->\s*/g, ' → ')
    .replace(/\s+to\s+/gi, ' → ')
    .trim();
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

function pickField(
  walkIn: DocumentData,
  service: DocumentData | null,
  data: DocumentData,
  keys: string[],
): string | null {
  for (const key of keys) {
    const fromWalkIn = readString(walkIn[key]);
    if (fromWalkIn) {
      return fromWalkIn;
    }
    const fromTop = readString(data[key]);
    if (fromTop) {
      return fromTop;
    }
    const fromForm = findServiceFormField(service, key);
    if (fromForm) {
      return fromForm;
    }
    if (service) {
      const direct = readString(service[key]);
      if (direct) {
        return direct;
      }
    }
  }
  return null;
}

function pushRow(rows: DetailRow[], label: string, value: string | null) {
  if (value?.trim()) {
    rows.push({ label, value: value.trim(), kind: 'text' });
  }
}

const PRIVATE_JET_DETAIL_ROW_ORDER = ['CARRIER', 'AIRCRAFT', 'ROUTE', 'TRAVELLERS'] as const;

/**
 * Pass Instant Sale private-jet sale doc (already loaded).
 */
export function extractPrivateJetSaleDetails(
  saleData: DocumentData,
): ExtractedPrivateJetSaleDetails {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;

  // CARRIER — Operator on Private Jet band
  const carrier =
    pickField(walkIn, service, saleData, [
      'serviceType',
      'bookingSource',
      'supplier',
      'operator',
      'carrier',
    ]) || readString(saleData.serviceName);

  // AIRCRAFT — Aircraft Type on walkIn.category
  const aircraft = pickField(walkIn, service, saleData, [
    'category',
    'aircraftType',
    'aircraft',
    'vehicleType',
  ]);

  // ROUTE — single itinerary line (no DEPARTS / ARRIVES)
  const route = formatRouteArrow(pickField(walkIn, service, saleData, ['route']));

  const travellers = travellerLine(saleData);

  const missingForMock: string[] = [];
  if (!carrier) missingForMock.push('walkIn.serviceType (operator)');
  if (!aircraft) missingForMock.push('walkIn.category (aircraftType)');
  if (!route) missingForMock.push('walkIn.route');
  if (!travellers) missingForMock.push('travellers');

  const detailRows: DetailRow[] = [];
  pushRow(detailRows, 'CARRIER', carrier);
  pushRow(detailRows, 'AIRCRAFT', aircraft);
  pushRow(detailRows, 'ROUTE', route);
  pushRow(detailRows, 'TRAVELLERS', travellers);

  detailRows.sort((a, b) => {
    const ai = PRIVATE_JET_DETAIL_ROW_ORDER.indexOf(
      a.label as (typeof PRIVATE_JET_DETAIL_ROW_ORDER)[number],
    );
    const bi = PRIVATE_JET_DETAIL_ROW_ORDER.indexOf(
      b.label as (typeof PRIVATE_JET_DETAIL_ROW_ORDER)[number],
    );
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  return {
    carrier,
    aircraft,
    route,
    travellers,
    detailRows,
    missingForMock,
  };
}
