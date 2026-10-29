/**
 * Customer / traveller CRM reads.
 *
 * Path: admins/{adminId}/customers
 *
 *   list:
 *     types → travellerTypes.ts
 *     map   → mapCustomerToTraveller.ts
 *     fetch → getTravellersForClient.ts
 *
 *   detail:
 *     types → travellerPersonalDetailsTypes.ts
 *     map   → mapTravellerPersonalDetails.ts
 *     fetch → getTravellerPersonalDetails.ts
 *
 *   shared profile:
 *     load → loadCustomerProfile.ts
 *             nested customers/{id}/customerProfile → collectionGroup → legacy
 *
 *   loyalty:
 *     types → travellerLoyaltyTypes.ts
 *     map   → mapTravellerLoyalty.ts
 *     fetch → getTravellerLoyalty.ts
 *
 *   hotels:
 *     types → travellerHotelPrefsTypes.ts
 *     map   → mapTravellerHotelPrefs.ts
 *     fetch → getTravellerHotelPrefs.ts
 *
 *   airlines:
 *     types → travellerAirlinePrefsTypes.ts
 *     map   → mapTravellerAirlinePrefs.ts
 *     fetch → getTravellerAirlinePrefs.ts
 */

export type { ClientTraveller, GetTravellersForClientResult } from './travellerTypes';

export { mapCustomerDocToTraveller } from './mapCustomerToTraveller';

export { getTravellersForClient, getTravellersForClientSafe } from './getTravellersForClient';

export type {
  TravellerPersonalDetails,
  GetTravellerPersonalDetailsResult,
} from './travellerPersonalDetailsTypes';

export { mapTravellerPersonalDetails } from './mapTravellerPersonalDetails';

export {
  getTravellerPersonalDetails,
  getTravellerPersonalDetailsSafe,
} from './getTravellerPersonalDetails';

export { loadCustomerProfile } from './loadCustomerProfile';

export type {
  TravellerLoyalty,
  TravellerLoyaltyRow,
  GetTravellerLoyaltyResult,
} from './travellerLoyaltyTypes';

export { mapTravellerLoyalty, maskLast4 } from './mapTravellerLoyalty';

export { getTravellerLoyalty, getTravellerLoyaltySafe } from './getTravellerLoyalty';

export type { TravellerHotelPrefs, GetTravellerHotelPrefsResult } from './travellerHotelPrefsTypes';

export { mapTravellerHotelPrefs } from './mapTravellerHotelPrefs';

export {
  getTravellerHotelPrefs,
  getTravellerHotelPrefsSafe,
  getClientTravellersHotelPrefs,
} from './getTravellerHotelPrefs';

export type {
  TravellerAirlinePrefs,
  GetTravellerAirlinePrefsResult,
} from './travellerAirlinePrefsTypes';

export { mapTravellerAirlinePrefs } from './mapTravellerAirlinePrefs';

export {
  getTravellerAirlinePrefs,
  getTravellerAirlinePrefsSafe,
  getClientTravellersAirlinePrefs,
} from './getTravellerAirlinePrefs';
