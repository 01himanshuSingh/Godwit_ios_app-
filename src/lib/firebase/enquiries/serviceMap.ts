import type { AppServiceCategory } from './appRequestTypes';

export type ServiceMapEntry = {
  keyword: string;
  fallback: string;
  mainKey: 'destinationCity' | 'route' | 'category';
  extraKey: 'route' | 'cabinClass' | 'category' | 'serviceType' | null;
  mainLabel: string;
  extraLabel: string | null;
};

/**
 * Per-service mapping is data, not separate writers.
 * UI category ids (camelCase) normalize to these keys before lookup.
 */
export const SERVICE_MAP: Record<AppServiceCategory, ServiceMapEntry> = {
  hotel: {
    keyword: 'hotel',
    fallback: 'Hotel Booking',
    mainKey: 'destinationCity',
    extraKey: 'route',
    mainLabel: 'City',
    extraLabel: 'Rooms',
  },
  flight: {
    keyword: 'air',
    fallback: 'AIR',
    mainKey: 'route',
    extraKey: 'cabinClass',
    mainLabel: 'Route',
    extraLabel: 'Cabin',
  },
  private_jet: {
    keyword: 'private jet',
    fallback: 'Private Jet',
    mainKey: 'route',
    extraKey: 'category',
    mainLabel: 'Route',
    extraLabel: 'Passengers',
  },
  villa: {
    keyword: 'other',
    fallback: 'Other Service',
    mainKey: 'category',
    extraKey: 'route',
    mainLabel: 'Where',
    extraLabel: 'Bedrooms',
  },
  yacht: {
    keyword: 'yacht',
    fallback: 'Yacht',
    mainKey: 'destinationCity',
    extraKey: 'category',
    mainLabel: 'Cruising area',
    extraLabel: 'Guests',
  },
  car_chauffeur: {
    keyword: 'chauffeur',
    fallback: 'Chauffeur',
    mainKey: 'destinationCity',
    extraKey: 'route',
    mainLabel: 'City',
    extraLabel: 'Pick-up',
  },
  airport_vip: {
    keyword: 'vip',
    fallback: 'Airport VIP',
    mainKey: 'destinationCity',
    extraKey: 'serviceType',
    mainLabel: 'Airport',
    extraLabel: 'Service',
  },
  other: {
    keyword: 'other',
    fallback: 'Other Service',
    mainKey: 'category',
    extraKey: null,
    mainLabel: 'Where',
    extraLabel: null,
  },
};

/** UI RequestServiceId → CRM appCategory */
export function normalizeAppServiceCategory(uiOrCrmId: string): AppServiceCategory {
  const key = uiOrCrmId.trim();
  switch (key) {
    case 'hotel':
    case 'flight':
    case 'villa':
    case 'yacht':
      return key;
    case 'privateJet':
    case 'private_jet':
      return 'private_jet';
    case 'chauffeur':
    case 'car_chauffeur':
      return 'car_chauffeur';
    case 'airportVip':
    case 'airport_vip':
      return 'airport_vip';
    case 'somethingElse':
    case 'other':
      return 'other';
    default:
      throw new Error(`Unsupported service category: ${uiOrCrmId}`);
  }
}
