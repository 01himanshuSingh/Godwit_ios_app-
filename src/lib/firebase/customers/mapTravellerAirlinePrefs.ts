/**
 * Pure mapper: customerProfile → TravellerAirlinePrefs.
 */

import type { DocumentData } from 'firebase/firestore';

import type { TravellerAirlinePrefs } from '@/lib/firebase/customers/travellerAirlinePrefsTypes';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

function readBool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  return null;
}

function asRecord(value: unknown): DocumentData {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DocumentData) : {};
}

export function mapTravellerAirlinePrefs(
  customerId: string,
  profileData: DocumentData | null | undefined,
): TravellerAirlinePrefs {
  const p = asRecord(profileData?.preferences);

  const preferredAirlines = null; // no dedicated CRM list today
  const specialMeal = readString(p.mealRequests);
  const seatPreference = readString(p.preferredSeating);
  const airportVipRequirement = readString(p.vipServices);
  const preferredClass = readString(p.preferredClass);
  const frequentFlyerMemberNumber = readString(p.memberNumber);
  const frequentFlyerActive = readBool(p.isActive);

  const summaryLine =
    [preferredAirlines, preferredClass, seatPreference, specialMeal].filter(Boolean).join(' · ') ||
    null;

  return {
    customerId,
    preferredAirlines,
    specialMeal,
    seatPreference,
    airportVipRequirement,
    preferredClass,
    frequentFlyerMemberNumber,
    frequentFlyerActive,
    summaryLine,
  };
}
