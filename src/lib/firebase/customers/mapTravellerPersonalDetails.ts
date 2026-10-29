/**
 * Pure mapper: customer doc → TravellerPersonalDetails.
 * No I/O — CRM field aliases stay here.
 */

import type { DocumentData, Timestamp } from 'firebase/firestore';

import type { TravellerPersonalDetails } from '@/lib/firebase/customers/travellerPersonalDetailsTypes';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
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
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDobLabel(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTelephone(mobile: string | null, countryCode: string | null): string | null {
  if (!mobile) return null;
  if (!countryCode) return mobile;
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  if (mobile.startsWith('+') || mobile.startsWith(code)) return mobile;
  return `${code} ${mobile}`;
}

export function mapTravellerPersonalDetails(
  customerId: string,
  data: DocumentData,
  documentPath: string,
): TravellerPersonalDetails {
  const fullName =
    readString(data.name) ||
    readString(data.fullName) ||
    readString(data.displayName) ||
    readString(data.customerName);

  const dob = toDate(data.dob) || toDate(data.dateOfBirth) || toDate(data.birthDate);
  const dateOfBirthLabel = formatDobLabel(dob);

  const nationality =
    readString(data.nationality) ||
    readString(data.country) ||
    readString(data.countryOfResidence) ||
    readString(data.homeCountry) ||
    null;

  const relationship =
    readString(data.relationship) ||
    readString(data.relation) ||
    readString(data.relationshipToClient) ||
    readString(data.travellerRole) ||
    readString(data.role) ||
    readString(data.customerRole) ||
    null;

  const email = readString(data.email) || readString(data.contactEmail);
  const mobileCountryCode = readString(data.mobileCountryCode);
  const telephone = formatTelephone(
    readString(data.mobile) || readString(data.phone) || readString(data.contactPhone),
    mobileCountryCode,
  );

  const summaryBits = [nationality, dateOfBirthLabel ? `born ${dateOfBirthLabel}` : null].filter(
    Boolean,
  ) as string[];

  return {
    customerId,
    fullName,
    dateOfBirthLabel,
    nationality,
    relationship,
    email,
    telephone,
    mobileCountryCode,
    summaryLine: summaryBits.length ? summaryBits.join(' · ') : null,
    documentPath,
  };
}
