/**
 * Pure mappers: CRM memberships → loyalty rows.
 * Mask last 4 in app (memberNumber stored plain, not AES).
 */

import type { DocumentData, Timestamp } from 'firebase/firestore';

import type {
  TravellerLoyalty,
  TravellerLoyaltyRow,
} from '@/lib/firebase/customers/travellerLoyaltyTypes';

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

function formatExpiryLabel(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Last 4 digits visible — "· · · · 3391" */
export function maskLast4(memberNumber: string | null | undefined): string | null {
  if (!memberNumber) return null;
  const digits = String(memberNumber).replace(/\s+/g, '').trim();
  if (!digits) return null;
  const last4 = digits.slice(-4);
  return `· · · · ${last4}`;
}

function readMemberships(profileData: DocumentData | null | undefined): DocumentData[] {
  if (!profileData) return [];
  const prefs = (profileData.preferences ?? {}) as DocumentData;
  const list = prefs.memberships ?? profileData.memberships;
  return Array.isArray(list) ? (list as DocumentData[]) : [];
}

export function mapMembershipToLoyaltyRow(
  membership: DocumentData,
  index: number,
  memberName: string | null,
): TravellerLoyaltyRow | null {
  const programName =
    readString(membership.programName) ||
    readString(membership.name) ||
    readString(membership.programme) ||
    readString(membership.program);
  if (!programName) return null;

  const memberNumber =
    readString(membership.memberNumber) ||
    readString(membership.membershipNumber) ||
    readString(membership.number);

  const expiry =
    toDate(membership.expiryDate) || toDate(membership.expiry) || toDate(membership.expiresAt);

  // No dedicated tier field in CRM today — keep null unless a real value appears later
  const tier = readString(membership.tier) || readString(membership.membershipTier) || null;

  const docUrl =
    readString(membership.docUrl) ||
    readString(membership.documentUrl) ||
    readString(membership.fileUrl) ||
    null;

  return {
    id: readString(membership.id) || `${programName}-${index}`,
    programName,
    memberName,
    memberNumberMasked: maskLast4(memberNumber),
    expiryDateLabel: formatExpiryLabel(expiry),
    docUrl,
    tier,
  };
}

export function mapTravellerLoyalty(
  customerId: string,
  profileData: DocumentData | null | undefined,
  travellerName: string | null,
): TravellerLoyalty {
  const rows = readMemberships(profileData)
    .map((m, i) => mapMembershipToLoyaltyRow(m, i, travellerName))
    .filter((r): r is TravellerLoyaltyRow => r != null);

  const summaryLine = rows.length > 0 ? rows.map((r) => r.programName).join(' · ') : null;

  return {
    customerId,
    rows,
    summaryLine,
  };
}
