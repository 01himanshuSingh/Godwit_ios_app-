/**
 * CRM has no trip cover image — local service heroes when present,
 * otherwise the previous remote placeholders.
 *
 * Local map (`assets/images/`):
 *   hotel.jpg       → hotel, hotelRoomExtension
 *   Yacht.jpg       → yacht
 *   privet-jet.jpg  → privateJet
 *   flight.jpg      → air, airExtras, airReissue
 *   chauffeur.jpg   → chauffeur
 *   Airport.jpg     → vip
 *
 * Still remote: experiences, visa, other / default
 */

import type { ImageSource } from 'expo-image';

import type { SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

export type TripCoverSource = ImageSource | number;

const LOCAL_HOTEL: number = require('../../../../../assets/images/hotel.jpg');
const LOCAL_YACHT: number = require('../../../../../assets/images/Yacht.jpg');
const LOCAL_PRIVATE_JET: number = require('../../../../../assets/images/privet-jet.jpg');
const LOCAL_FLIGHT: number = require('../../../../../assets/images/flight.jpg');
const LOCAL_CHAUFFEUR: number = require('../../../../../assets/images/chauffeur.jpg');
const LOCAL_AIRPORT: number = require('../../../../../assets/images/Airport.jpg');

/** Retina-friendly crop for remote trip heroes (services without a local asset). */
const Q = 'auto=format&fit=crop&w=1920&h=1280&q=85';

const REMOTE_EXPERIENCE = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?${Q}`;
const REMOTE_DEFAULT = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${Q}`;

function remote(uri: string): ImageSource {
  return { uri };
}

/** Cover source for CurrentTripCard (local asset or remote URI). */
export function coverSourceForServiceType(type: SaleServiceType): TripCoverSource {
  switch (type) {
    case 'hotel':
    case 'hotelRoomExtension':
      return LOCAL_HOTEL;
    case 'yacht':
      return LOCAL_YACHT;
    case 'privateJet':
      return LOCAL_PRIVATE_JET;
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return LOCAL_FLIGHT;
    case 'chauffeur':
      return LOCAL_CHAUFFEUR;
    case 'vip':
      return LOCAL_AIRPORT;
    case 'experiences':
      return remote(REMOTE_EXPERIENCE);
    case 'visa':
    case 'other':
    default:
      return remote(REMOTE_DEFAULT);
  }
}

/** Debug / legacy string form — local assets report an asset: tag. */
export function coverUrlForServiceType(type: SaleServiceType): string {
  const source = coverSourceForServiceType(type);
  if (typeof source === 'number') {
    switch (type) {
      case 'hotel':
      case 'hotelRoomExtension':
        return 'asset:hotel';
      case 'yacht':
        return 'asset:yacht';
      case 'privateJet':
        return 'asset:private-jet';
      case 'air':
      case 'airExtras':
      case 'airReissue':
        return 'asset:flight';
      case 'chauffeur':
        return 'asset:chauffeur';
      case 'vip':
        return 'asset:airport';
      default:
        return 'asset:local';
    }
  }
  if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }
  return REMOTE_DEFAULT;
}
