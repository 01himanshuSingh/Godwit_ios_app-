/**
 * Interim inventory options for Preferred Hotel / Preferred Airline dropdowns.
 * Replace with CRM inventory when available; free-text "Other" remains allowed in UI.
 */

export type InventoryOption = {
  id: string;
  label: string;
};

export const PREFERRED_HOTEL_OPTIONS: readonly InventoryOption[] = [
  { id: 'aman', label: 'Aman' },
  { id: 'four-seasons', label: 'Four Seasons' },
  { id: 'rosewood', label: 'Rosewood' },
  { id: 'ritz-carlton', label: 'The Ritz-Carlton' },
  { id: 'mandarin-oriental', label: 'Mandarin Oriental' },
  { id: 'belmond', label: 'Belmond' },
  { id: 'six-senses', label: 'Six Senses' },
  { id: 'other', label: 'Other / tell us in notes' },
] as const;

export const PREFERRED_AIRLINE_OPTIONS: readonly InventoryOption[] = [
  { id: 'ba', label: 'British Airways' },
  { id: 'ek', label: 'Emirates' },
  { id: 'qr', label: 'Qatar Airways' },
  { id: 'sq', label: 'Singapore Airlines' },
  { id: 'af', label: 'Air France' },
  { id: 'lh', label: 'Lufthansa' },
  { id: 'aa', label: 'American Airlines' },
  { id: 'ua', label: 'United Airlines' },
  { id: 'other', label: 'Other / tell us in notes' },
] as const;

export const CABIN_CLASS_OPTIONS: readonly InventoryOption[] = [
  { id: 'economy', label: 'Economy' },
  { id: 'premium_economy', label: 'Premium Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First' },
] as const;

export const FLIGHT_TRIP_TYPE_OPTIONS: readonly InventoryOption[] = [
  { id: 'one_way', label: 'One Way' },
  { id: 'round_trip', label: 'Round Trip' },
] as const;

export const PRIVATE_JET_TRIP_TYPE_OPTIONS: readonly InventoryOption[] = [
  { id: 'one_way', label: 'One Way' },
  { id: 'round_trip', label: 'Round Trip' },
] as const;

export const YACHT_CHARTER_TYPE_OPTIONS: readonly InventoryOption[] = [
  { id: 'private', label: 'Private' },
  { id: 'shared', label: 'Shared' },
] as const;

/**
 * Mirrors CRM Instant Sale chauffeur service types
 * (`assign-service-page.component.ts` → chauffeurServiceTypeOptions).
 * CRM does not expose these via Firestore — same hardcoded catalog as Instant Sale.
 */
export const CHAUFFEUR_SERVICE_TYPE_OPTIONS: readonly InventoryOption[] = [
  { id: 'airport_arrival', label: 'Airport Arrival' },
  { id: 'airport_departure', label: 'Airport Departure' },
  { id: 'disposal', label: 'Disposal' },
  { id: 'self_drive', label: 'Self Drive' },
] as const;

/**
 * Mirrors CRM Instant Sale Airport VIP service types
 * (`assign-service-page.component.ts` → vipServiceTypeOptions).
 * CRM does not expose these via Firestore — same hardcoded catalog as Instant Sale.
 */
export const AIRPORT_VIP_SERVICE_TYPE_OPTIONS: readonly InventoryOption[] = [
  { id: 'arrival', label: 'Arrival' },
  { id: 'departure', label: 'Departure' },
  { id: 'transit', label: 'Transit' },
] as const;
