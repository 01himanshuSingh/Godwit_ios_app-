/**
 * Home trip spotlight
 *   1) current in-window cluster
 *   2) else soonest upcoming cluster
 *   3) else null
 *
 *   types  → currentTripCardTypes.ts
 *   pure   → buildClientCurrentTripCard.ts
 *   fetch  → getClientCurrentTripCard.ts
 */

export type {
  HomeTripCardMode,
  CurrentTripServiceIcon,
  CurrentTripServiceChip,
  CurrentTripNextUp,
  ClientCurrentTripCard,
  GetClientCurrentTripCardResult,
} from './currentTripCardTypes';

export { coverUrlForServiceType } from './coverPlaceholders';

export {
  todayLocalKey,
  dayDiff,
  isCurrentSale,
  isUpcomingSale,
  primaryServiceRank,
  pickPrimarySale,
  saleDateTimeMs,
  clusterCurrentSales,
  pickUpcomingCluster,
  composeTripClusterCard,
  buildHomeTripSpotlightCard,
  buildClientCurrentTripCard,
} from './buildClientCurrentTripCard';

export {
  getClientCurrentTripCard,
  getClientCurrentTripCardSafe,
  getHomeTripSpotlightCard,
  getHomeTripSpotlightCardSafe,
} from './getClientCurrentTripCard';
