/**
 * CRM has no trip cover image — high-res, intent-matched placeholders
 * by primary service type for Home CurrentTripCard.
 */

import type { SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

/** Retina-friendly crop for the trip hero. */
const Q = 'auto=format&fit=crop&w=1920&h=1280&q=85';

/** Luxury alpine / resort stay. */
const HOTEL = `https://images.unsplash.com/photo-1609137144813-7d9921338f24?${Q}`;

/** Superyacht on open water. */
const YACHT = `https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?${Q}`;

/** Private jet on the apron. */
const PRIVATE_JET = `https://images.unsplash.com/photo-1540339832862-474599807836?${Q}`;

/** Scheduled / commercial flight. */
const AIR = `https://images.unsplash.com/photo-1529074963764-98f45c47344b?${Q}`;

/** Luxury chauffeur / black car. */
const CHAUFFEUR = `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${Q}`;

/** Curated destination experience. */
const EXPERIENCE = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?${Q}`;

/** Airport VIP / terminal arrival. */
const VIP = `https://images.unsplash.com/photo-1556388158-158ea5ccacbd?${Q}`;

/** Travel journey fallback. */
const DEFAULT = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${Q}`;

export function coverUrlForServiceType(type: SaleServiceType): string {
  switch (type) {
    case 'hotel':
    case 'hotelRoomExtension':
      return HOTEL;
    case 'yacht':
      return YACHT;
    case 'privateJet':
      return PRIVATE_JET;
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return AIR;
    case 'chauffeur':
      return CHAUFFEUR;
    case 'experiences':
      return EXPERIENCE;
    case 'vip':
      return VIP;
    case 'visa':
    case 'other':
    default:
      return DEFAULT;
  }
}
