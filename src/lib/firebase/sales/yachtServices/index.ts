/**
 * Yacht Instant Sale service layer.
 * Shared Active Trip / list fetch stays in `../getActiveTripDetail.ts` and
 * `../getClientUpcomingSales.ts`.
 *
 * Sibling: `../hotelServices/`, `../airServices/`, `../vipServices/`, `../privateJetServices/`.
 */

export {
  getYachtSaleCard,
  mapSaleToYachtCardUI,
  mapYachtUpcomingCardFields,
  type YachtSaleCardUI,
  type YachtUpcomingCardFields,
} from './mapSaleToYachtCardUI';

export { mapYachtDetail } from './mapYachtDetail';
