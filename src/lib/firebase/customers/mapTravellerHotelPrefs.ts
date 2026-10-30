/**
 * Pure mapper: customerProfile → TravellerHotelPrefs.
 */

import type { DocumentData } from 'firebase/firestore';

import type { TravellerHotelPrefs } from '@/lib/firebase/customers/travellerHotelPrefsTypes';

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

function readBrands(pref: DocumentData, fromList: DocumentData): string | null {
  return (
    readString(pref.preferredHotelBrands) ||
    readString(pref.hotelBrands) ||
    readString(pref.preferredHotels) ||
    readString(pref.hotelBrandPreferences) ||
    readString(fromList.preferredHotelBrands) ||
    readString(fromList.hotelBrands) ||
    readString(fromList.preferredHotels) ||
    null
  );
}

export function mapTravellerHotelPrefs(
  customerId: string,
  profileData: DocumentData | null | undefined,
  memberName: string | null,
): TravellerHotelPrefs {
  const pref = asRecord(profileData?.preferences);
  const travellerList = Array.isArray(profileData?.travellerList) ? profileData.travellerList : [];
  const fromList = asRecord(travellerList[0]);

  const preferredRoomType = readString(pref.roomType) || readString(fromList.roomType) || null;
  const preferredHotelBrands = readBrands(pref, fromList);

  const specialRequests =
    readString(pref.specialRequests) || readString(fromList.specialRequests) || null;

  const summaryBits = [preferredHotelBrands, preferredRoomType].filter(Boolean) as string[];

  return {
    customerId,
    memberName,
    preferredRoomType,
    preferredHotelBrands,
    specialRequests,
    hotelRewardMember: readBool(pref.isHotelRewardMember) ?? readBool(fromList.isHotelRewardMember),
    hotelMemberNumber:
      readString(pref.hotelMemberNumber) || readString(fromList.hotelMemberNumber) || null,
    summaryLine: summaryBits.length ? summaryBits.join(' · ') : null,
  };
}
