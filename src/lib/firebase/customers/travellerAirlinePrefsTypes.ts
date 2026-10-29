/**
 * Traveller commercial airline preferences.
 * Source: customerProfile.preferences
 */

export type TravellerAirlinePrefs = {
  customerId: string;
  /** Not in CRM today */
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
   * Header preview. Airlines missing → class · seating · meal.
   */
  summaryLine: string | null;
};

export type GetTravellerAirlinePrefsResult = {
  airlinePrefs: TravellerAirlinePrefs | null;
  errorMessage: string | null;
};
