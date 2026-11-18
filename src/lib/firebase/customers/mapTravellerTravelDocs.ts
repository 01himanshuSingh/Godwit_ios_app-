/**
 * Pure mapper: customerProfile → Travel Documents card rows.
 * CRM-only fields — no invented passport numbers / residence subtypes.
 */

import type { DocumentData, Timestamp } from 'firebase/firestore';

import { decryptMobile } from '@/lib/crypto/decryptMobile';
import { maskLast4 } from '@/lib/firebase/customers/mapTravellerLoyalty';
import type {
  TravelDocItem,
  TravelDocStatus,
  TravellerTravelDocs,
} from '@/lib/firebase/customers/travellerTravelDocTypes';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

function asRecord(value: unknown): DocumentData {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DocumentData) : {};
}

function asList(value: unknown): DocumentData[] {
  return Array.isArray(value) ? (value as DocumentData[]) : [];
}

function decryptMaybe(value: unknown, key: string): string | null {
  const raw = readString(value);
  if (!raw) return null;
  const plain = decryptMobile(raw, key).trim();
  return plain.length ? plain : null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof (value as Timestamp)?.toDate === 'function') {
    try {
      const d = (value as Timestamp).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const s = String(value).trim();
    const d = new Date(s.includes('T') ? s : s.length >= 10 ? `${s.slice(0, 10)}T12:00:00` : s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toDateKey(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatExpiryLabel(d: Date | null, status: TravelDocStatus): string | null {
  if (!d) return null;
  const label = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return status === 'Expired' ? `Expired ${label}` : `Expires ${label}`;
}

function readCountry(row: DocumentData, encryptionKey: string): string | null {
  return (
    decryptMaybe(row.country, encryptionKey) ||
    decryptMaybe(row.countryName, encryptionKey) ||
    decryptMaybe(row.issuingCountry, encryptionKey) ||
    readString(row.country) ||
    readString(row.countryName) ||
    readString(row.issuingCountry) ||
    readString(row.nationality)
  );
}

function readMaskedDocNumber(row: DocumentData, encryptionKey: string): string | null {
  const raw =
    decryptMaybe(row.passportNumber, encryptionKey) ||
    decryptMaybe(row.documentNumber, encryptionKey) ||
    decryptMaybe(row.number, encryptionKey) ||
    readString(row.passportNumber) ||
    readString(row.documentNumber) ||
    readString(row.number) ||
    readString(row.visaNumber);
  return maskLast4(raw);
}

function statusFromExpiry(d: Date | null, renewDays = 90): TravelDocStatus {
  if (!d) return 'Unknown';
  const now = new Date();
  if (d.getTime() < now.getTime()) return 'Expired';
  const ms = d.getTime() - now.getTime();
  if (ms <= renewDays * 24 * 60 * 60 * 1000) return 'Renew soon';
  return 'Valid';
}

function readDocUrl(row: DocumentData): string | null {
  return (
    readString(row.docUrl) ||
    readString(row.documentUrl) ||
    readString(row.fileUrl) ||
    readString(row.url) ||
    null
  );
}

function buildDetailLine(country: string | null, maskedNumber: string | null): string | null {
  if (country && maskedNumber) {
    // maskedNumber already starts with "· · · · " — avoid a double separator.
    return `${country} ${maskedNumber}`;
  }
  return country || maskedNumber || null;
}

/**
 * Map CRM profile → travel doc rows (passport / visa / membership with real fields only).
 */
export function mapTravellerTravelDocs(
  customerId: string,
  profileData: DocumentData | null | undefined,
  encryptionKey: string,
): TravellerTravelDocs {
  if (!profileData) {
    return {
      customerId,
      items: [],
      summaryLine: '0 on file · numbers always masked',
    };
  }

  const prefs = asRecord(profileData.preferences);
  const items: TravelDocItem[] = [];
  const seen = new Set<string>();

  const passports = [...asList(prefs.passports), ...asList(profileData.passports)];
  passports.forEach((p, index) => {
    const expiryRaw =
      decryptMaybe(p.expiryEnd, encryptionKey) ||
      decryptMaybe(p.expiryDate, encryptionKey) ||
      readString(p.expiryEnd) ||
      readString(p.expiryDate);
    const expiryDate = toDate(expiryRaw) || toDate(p.expiryEnd) || toDate(p.expiryDate);
    const status = statusFromExpiry(expiryDate);
    const country = readCountry(p, encryptionKey);
    const maskedNumber = readMaskedDocNumber(p, encryptionKey);
    const docUrl = readDocUrl(p);
    const key = `passport:${docUrl || index}:${toDateKey(expiryDate) || ''}`;
    if (seen.has(key)) return;
    seen.add(key);

    items.push({
      id: key,
      type: 'passport',
      title: 'Passport',
      country,
      maskedNumber,
      detailLine: buildDetailLine(country, maskedNumber),
      expiresAtKey: toDateKey(expiryDate),
      expiresAtLabel: formatExpiryLabel(expiryDate, status),
      status,
      docUrl,
    });
  });

  const visas = [...asList(prefs.visas), ...asList(profileData.visas)];
  visas.forEach((v, index) => {
    const country = readCountry(v, encryptionKey);
    const visaType =
      readString(v.visaType) ||
      readString(v.type) ||
      readString(v.category) ||
      readString(v.visaCategory);
    const title = visaType ? `Visa (${visaType})` : 'Visa';
    const expiryRaw =
      decryptMaybe(v.expiryEnd, encryptionKey) ||
      decryptMaybe(v.expiryDate, encryptionKey) ||
      readString(v.expiryEnd) ||
      readString(v.expiryDate);
    const expiryDate = toDate(expiryRaw) || toDate(v.expiryEnd) || toDate(v.expiryDate);
    const status = statusFromExpiry(expiryDate);
    const maskedNumber = readMaskedDocNumber(v, encryptionKey);
    const docUrl = readDocUrl(v);
    const key = `visa:${country || ''}:${docUrl || index}:${toDateKey(expiryDate) || ''}`;
    if (seen.has(key)) return;
    seen.add(key);

    items.push({
      id: key,
      type: 'visa',
      title,
      country,
      maskedNumber,
      detailLine: buildDetailLine(country, maskedNumber),
      expiresAtKey: toDateKey(expiryDate),
      expiresAtLabel: formatExpiryLabel(expiryDate, status),
      status,
      docUrl,
    });
  });

  const memberships = [...asList(prefs.memberships), ...asList(profileData.memberships)];
  memberships.forEach((m, index) => {
    const title =
      readString(m.programName) ||
      readString(m.name) ||
      readString(m.programme) ||
      readString(m.program) ||
      'Membership';
    const memberNumber =
      readString(m.memberNumber) || readString(m.membershipNumber) || readString(m.number);
    const maskedNumber = maskLast4(memberNumber);
    const expiryDate = toDate(m.expiryDate) || toDate(m.expiry) || toDate(m.expiresAt);
    const status = statusFromExpiry(expiryDate);
    const docUrl = readDocUrl(m);
    const key = `membership:${title}:${docUrl || index}:${toDateKey(expiryDate) || ''}`;
    if (seen.has(key)) return;
    seen.add(key);

    items.push({
      id: key,
      type: 'membership',
      title,
      country: null,
      maskedNumber,
      detailLine: buildDetailLine(null, maskedNumber),
      expiresAtKey: toDateKey(expiryDate),
      expiresAtLabel: formatExpiryLabel(expiryDate, status),
      status,
      docUrl,
    });
  });

  items.sort((a, b) => String(a.expiresAtKey || '').localeCompare(String(b.expiresAtKey || '')));

  const count = items.length;
  return {
    customerId,
    items,
    summaryLine: `${count} on file · numbers always masked`,
  };
}
