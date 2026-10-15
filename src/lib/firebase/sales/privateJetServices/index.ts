/**
 * Private jet Instant Sale service layer.
 * Shared Active Trip fetch stays in `../getActiveTripDetail.ts`.
 *
 * Sibling: `../hotelServices/`, `../airServices/`, `../vipServices/`, `../chauffeurServices/`.
 * Not Phase 2 Avinode (`features/private-jets`) — Instant Sale CRM bookings only.
 */

export { extractPrivateJetSaleDetails } from './extractPrivateJetSaleDetails';

export { mapPrivateJetDetail } from './mapPrivateJetDetail';
