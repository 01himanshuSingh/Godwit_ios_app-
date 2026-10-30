/**
 * Traveller hotel preferences — Hotels card on traveller detail.
 * Source: customerProfile.preferences (+ travellerList[0] aliases)
 */

export type TravellerHotelPrefs = {
  customerId: string;
  memberName: string | null;
  /** CRM: preferences.roomType — e.g. "Suite, high floor, quiet" */
  preferredRoomType: string | null;
  /**
   * CRM: preferences.preferredHotelBrands (aliases: hotelBrands, preferredHotels)
   * e.g. "Aman, Mandarin Oriental, Rosewood"
   */
  preferredHotelBrands: string | null;
  specialRequests: string | null;
  hotelRewardMember: boolean | null;
  hotelMemberNumber: string | null;
  /**
   * Header preview — brands · room type when present.
   */
  summaryLine: string | null;
};

/** Editable hotel fields on the Hotels card. */
export type TravellerHotelPrefField = 'preferredHotelBrands' | 'preferredRoomType';

export type GetTravellerHotelPrefsResult = {
  hotelPrefs: TravellerHotelPrefs | null;
  errorMessage: string | null;
};
