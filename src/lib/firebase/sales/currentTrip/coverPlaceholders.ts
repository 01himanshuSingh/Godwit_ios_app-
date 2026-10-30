/**
 * CRM has no trip cover image — static placeholders by primary service type.
 */

import type { SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

const HOTEL =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';
const YACHT =
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80';
const AIR =
  'https://images.unsplash.com/photo-1436491865332-7a61a1093540?auto=format&fit=crop&w=1200&q=80';
const CHAUFFEUR =
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80';
const EXPERIENCE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';

export function coverUrlForServiceType(type: SaleServiceType): string {
  switch (type) {
    case 'hotel':
    case 'hotelRoomExtension':
      return HOTEL;
    case 'yacht':
      return YACHT;
    case 'air':
    case 'airExtras':
    case 'airReissue':
    case 'privateJet':
      return AIR;
    case 'chauffeur':
      return CHAUFFEUR;
    case 'experiences':
    case 'vip':
      return EXPERIENCE;
    default:
      return HOTEL;
  }
}
