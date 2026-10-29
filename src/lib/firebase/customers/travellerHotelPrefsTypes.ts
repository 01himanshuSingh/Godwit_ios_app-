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
   * Not in CRM today (Aman / Mandarin / Rosewood).
   * Kept null until a dedicated field exists.
   */
  preferredHotelBrands: string | null;
  specialRequests: string | null;
  hotelRewardMember: boolean | null;
  hotelMemberNumber: string | null;
  /**
   * Header preview. Brands missing → room type (or special requests) only.
   */
  summaryLine: string | null;
};

export type GetTravellerHotelPrefsResult = {
  hotelPrefs: TravellerHotelPrefs | null;
  errorMessage: string | null;
};
