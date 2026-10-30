/**
 * Traveller commercial airline preferences.
 * Source: customerProfile.preferences
 */

export type TravellerAirlinePrefs = {
  customerId: string;
  /** preferences.preferredAirlines (aliases: airlines, preferredAirline) */
  preferredAirlines: string | null;
  /** preferences.mealRequests */
  specialMeal: string | null;
  /** preferences.preferredSeating */
  seatPreference: string | null;
  /** preferences.vipServices */
  airportVipRequirement: string | null;
  /** preferences.preferredClass — extra, not on mock */
  preferredClass: string | null;
  /** preferences.memberNumber */
  frequentFlyerMemberNumber: string | null;
  /** preferences.isActive */
  frequentFlyerActive: boolean | null;
  /**
   * Header preview — airlines · class · seating · meal when present.
   */
  summaryLine: string | null;
};

/** Editable airline fields on the Commercial Airlines card. */
export type TravellerAirlinePrefField =
  'preferredAirlines' | 'specialMeal' | 'seatPreference' | 'airportVipRequirement';

export type GetTravellerAirlinePrefsResult = {
  airlinePrefs: TravellerAirlinePrefs | null;
  errorMessage: string | null;
};
