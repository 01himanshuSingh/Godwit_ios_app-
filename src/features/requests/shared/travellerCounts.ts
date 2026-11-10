/**
 * Shared adult / child / infant party counts for request forms.
 */

export type TravellerCounts = {
  adults: number;
  children: number;
  infants: number;
};

export const INITIAL_TRAVELLER_COUNTS: TravellerCounts = {
  adults: 2,
  children: 0,
  infants: 0,
};

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
