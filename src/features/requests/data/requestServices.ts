/**
 * New request — service starting points (catalog for the 2×4 grid).
 * Outline icons matching the reference mock.
 */

export type RequestServiceId =
  | 'hotel'
  | 'flight'
  | 'privateJet'
  | 'villa'
  | 'yacht'
  | 'chauffeur'
  | 'airportVip'
  | 'somethingElse';

export type RequestServiceIconName =
  | 'business-outline'
  | 'airplane-outline'
  | 'boat-outline'
  | 'car-outline'
  | 'notifications-outline'
  | 'sparkles-outline';

export type RequestService = {
  id: RequestServiceId;
  label: string;
  icon: RequestServiceIconName;
  /** Feather | Ionicons */
  iconSet: 'feather' | 'ionicons';
};

export const REQUEST_SERVICES: readonly RequestService[] = [
  { id: 'hotel', label: 'Hotel', icon: 'business-outline', iconSet: 'ionicons' },
  { id: 'flight', label: 'Flight', icon: 'airplane-outline', iconSet: 'ionicons' },
  { id: 'privateJet', label: 'Private jet', icon: 'airplane-outline', iconSet: 'ionicons' },
  { id: 'villa', label: 'Villa', icon: 'business-outline', iconSet: 'ionicons' },
  { id: 'yacht', label: 'Yacht', icon: 'boat-outline', iconSet: 'ionicons' },
  { id: 'chauffeur', label: 'Chauffeur', icon: 'car-outline', iconSet: 'ionicons' },
  { id: 'airportVip', label: 'Airport VIP', icon: 'notifications-outline', iconSet: 'ionicons' },
  { id: 'somethingElse', label: 'Something else', icon: 'sparkles-outline', iconSet: 'ionicons' },
] as const;
