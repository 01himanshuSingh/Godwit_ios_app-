/**
 * Hotel Instant Sale service layer.
 *
 * Keep hotel-only extractors / mappers here.
 * Shared Active Trip fetch stays in `../getActiveTripDetail.ts`.
 * Sibling: `../airServices/`, `../vipServices/`. Future: `chauffeurServices/`.
 */

export {
  applyHotelCancellationTermsToDetail,
  extractHotelCancellationTerms,
  fetchHotelCancellationTerms,
} from './extractHotelCancellationTerms';

export {
  extractGodwitBenefitsFromHotelSale,
  fetchHotelGodwitBenefits,
  fetchHotelGodwitBenefitsSafe,
  loadPreferredPartnership,
  parseGodwitBenefitLines,
  readPreferredPartnershipId,
} from './extractHotelGodwitBenefits';

export {
  applyHotelConfirmationToDetail,
  extractHotelSaleConfirmationDetails,
  fetchHotelSaleConfirmationDetails,
  fetchHotelSaleConfirmationDetailsSafe,
} from './extractHotelSaleConfirmationDetails';

export { extractHotelSaleRoomType, getHotelSaleRoomType } from './extractHotelSaleRoomType';

export { mapHotelDetail } from './mapHotelDetail';
