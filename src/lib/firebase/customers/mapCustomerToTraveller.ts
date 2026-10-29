/**
 * Pure mapper: customer doc → ClientTraveller list row.
 * No I/O — keep CRM field aliases here.
 */

import type { DocumentData } from 'firebase/firestore';

import type { ClientTraveller } from '@/lib/firebase/customers/travellerTypes';

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

function pickFirst(data: DocumentData, keys: string[]): string | null {
  for (const key of keys) {
    const v = readString(data[key]);
    if (v) return v;
  }
  return null;
}

function readBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    return t === 'true' || t === '1' || t === 'yes' || t === 'minor';
  }
  if (typeof value === 'number') return value === 1;
  return false;
}

function buildDetailLine(parts: {
  relationship: string | null;
  country: string | null;
  isMinor: boolean;
}): string | null {
  const bits: string[] = [];
  if (parts.relationship) bits.push(parts.relationship);
  if (parts.country) bits.push(parts.country);
  if (parts.isMinor) bits.push('Minor');
  return bits.length ? bits.join(' · ') : null;
}

export function mapCustomerDocToTraveller(docId: string, data: DocumentData): ClientTraveller {
  const name = pickFirst(data, ['name', 'fullName', 'displayName', 'customerName']) ?? '';

  const relationship = pickFirst(data, [
    'relationship',
    'relation',
    'relationshipToClient',
    'role',
    'travellerRole',
    'customerRole',
  ]);

  const country = pickFirst(data, [
    'country',
    'nationality',
    'countryOfResidence',
    'homeCountry',
    'passportCountry',
  ]);

  const isMinor =
    readBool(data.isMinor) ||
    readBool(data.minor) ||
    String(data.ageGroup || '')
      .toLowerCase()
      .includes('minor');

  const clientIds = Array.isArray(data.clientIds)
    ? data.clientIds.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];

  return {
    customerId: String(data.customerId || docId).trim() || docId,
    name,
    email: pickFirst(data, ['email', 'contactEmail']),
    mobile: pickFirst(data, ['mobile', 'phone', 'contactPhone']),
    clientId: pickFirst(data, ['clientId']),
    clientIds,
    relationship,
    country,
    isMinor,
    detailLine: buildDetailLine({ relationship, country, isMinor }),
    raw: data,
  };
}
