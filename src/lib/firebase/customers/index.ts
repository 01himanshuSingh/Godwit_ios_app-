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
 *   travel docs:
 *     types → travellerTravelDocTypes.ts
 *     map   → mapTravellerTravelDocs.ts
 *     fetch → getTravellerTravelDocs.ts
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
 *     write → updateTravellerHotelPrefs.ts
 *
 *   airlines:
 *     types → travellerAirlinePrefsTypes.ts
 *     map   → mapTravellerAirlinePrefs.ts
 *     fetch → getTravellerAirlinePrefs.ts
 *     write → updateTravellerAirlinePrefs.ts
 */

export type { ClientTraveller, GetTravellersForClientResult } from './travellerTypes';

export { mapCustomerDocToTraveller } from './mapCustomerToTraveller';

export { getTravellersForClient, getTravellersForClientSafe } from './getTravellersForClient';

export {
  classifyTravellersLoadError,
  mapTravellersLoadErrorToMessage,
  type TravellersLoadErrorKind,
} from './mapTravellersLoadError';

export type {
  TravellerPersonalDetails,
  GetTravellerPersonalDetailsResult,
} from './travellerPersonalDetailsTypes';

export { mapTravellerPersonalDetails } from './mapTravellerPersonalDetails';

export {
  getTravellerPersonalDetails,
  getTravellerPersonalDetailsSafe,
} from './getTravellerPersonalDetails';

export { loadCustomerProfile, loadCustomerProfileSnapshot } from './loadCustomerProfile';
export type { CustomerProfileSnapshot } from './loadCustomerProfile';

export type {
  TravelDocStatus,
  TravelDocType,
  TravelDocItem,
  TravellerTravelDocs,
  GetTravellerTravelDocsResult,
} from './travellerTravelDocTypes';

export { mapTravellerTravelDocs } from './mapTravellerTravelDocs';

export { getTravellerTravelDocs, getTravellerTravelDocsSafe } from './getTravellerTravelDocs';

export type {
  TravellerLoyalty,
  TravellerLoyaltyRow,
  GetTravellerLoyaltyResult,
} from './travellerLoyaltyTypes';

export { mapTravellerLoyalty, maskLast4 } from './mapTravellerLoyalty';

export { getTravellerLoyalty, getTravellerLoyaltySafe } from './getTravellerLoyalty';

export type {
  TravellerHotelPrefs,
  TravellerHotelPrefField,
  GetTravellerHotelPrefsResult,
} from './travellerHotelPrefsTypes';

export { mapTravellerHotelPrefs } from './mapTravellerHotelPrefs';

export {
  getTravellerHotelPrefs,
  getTravellerHotelPrefsSafe,
  getClientTravellersHotelPrefs,
} from './getTravellerHotelPrefs';

export {
  updateTravellerHotelPref,
  updateTravellerHotelPrefSafe,
} from './updateTravellerHotelPrefs';
export type { UpdateTravellerHotelPrefsResult } from './updateTravellerHotelPrefs';

export type {
  TravellerAirlinePrefs,
  TravellerAirlinePrefField,
  GetTravellerAirlinePrefsResult,
} from './travellerAirlinePrefsTypes';

export { mapTravellerAirlinePrefs } from './mapTravellerAirlinePrefs';

export {
  getTravellerAirlinePrefs,
  getTravellerAirlinePrefsSafe,
  getClientTravellersAirlinePrefs,
} from './getTravellerAirlinePrefs';

export {
  updateTravellerAirlinePref,
  updateTravellerAirlinePrefSafe,
} from './updateTravellerAirlinePrefs';
export type { UpdateTravellerAirlinePrefsResult } from './updateTravellerAirlinePrefs';
