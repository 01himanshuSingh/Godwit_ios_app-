/**
 * Shared adult / child / infant party counts for request forms.
 * Default is one adult — Travellers / Passengers can be skipped with this assumed.
 */

export type TravellerCounts = {
  adults: number;
  children: number;
  infants: number;
};

/** Prefill for every New-request Travellers / Passengers section. */
export const DEFAULT_PARTY_SIZE = 1;

export const INITIAL_TRAVELLER_COUNTS: TravellerCounts = {
  adults: DEFAULT_PARTY_SIZE,
  children: 0,
  infants: 0,
};

/** If the client skips or clears the party, assume one adult. */
export function ensureMinAdultParty(counts: TravellerCounts): TravellerCounts {
  if (counts.adults >= 1) return counts;
  return { ...counts, adults: DEFAULT_PARTY_SIZE };
}

/** Single passenger / guest steppers (chauffeur, jet, yacht). */
export function ensureMinPartySize(value: number, min = DEFAULT_PARTY_SIZE): number {
  if (!Number.isFinite(value) || value < min) return min;
  return Math.floor(value);
}

export function formatTravellerCountLabel(counts: TravellerCounts): string {
  const parts: string[] = [];
  if (counts.adults > 0) {
    parts.push(`${counts.adults} Adult${counts.adults === 1 ? '' : 's'}`);
  }
  if (counts.children > 0) {
    parts.push(`${counts.children} Child${counts.children === 1 ? '' : 'ren'}`);
  }
  if (counts.infants > 0) {
    parts.push(`${counts.infants} Infant${counts.infants === 1 ? '' : 's'}`);
  }
  return parts.join(', ') || 'Guests to be confirmed';
}

export function totalTravellers(counts: TravellerCounts): number {
  return counts.adults + counts.children + counts.infants;
}
