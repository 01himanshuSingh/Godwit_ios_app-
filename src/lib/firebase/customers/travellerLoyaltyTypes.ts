/**
 * Traveller loyalty programmes — view model for Profile → Traveller detail.
 * Source: admins/{adminId}/customerProfile (customerId == traveller)
 *         + customers/{customerId}.name for member name
 */

export type TravellerLoyaltyRow = {
  id: string;
  programName: string;
  memberName: string | null;
  /** Masked for UI — e.g. "· · · · 3391" */
  memberNumberMasked: string | null;
  expiryDateLabel: string | null;
  docUrl: string | null;
  /** Not in CRM today — kept for future */
  tier: string | null;
};

export type TravellerLoyalty = {
  customerId: string;
  rows: TravellerLoyaltyRow[];
  /** Header preview — "Emirates Skywards · Marriott Bonvoy · …" */
  summaryLine: string | null;
};

export type GetTravellerLoyaltyResult = {
  loyalty: TravellerLoyalty | null;
  errorMessage: string | null;
};
