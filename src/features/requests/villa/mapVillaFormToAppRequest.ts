/**
 * Villa UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import { formatDateRangeLabel, formatIsoDate } from '@/features/requests/shared/formDateUtils';
import {
  formatTravellerCountLabel,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';

export type VillaFormSubmitInput = {
  destination: string;
  placeId?: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  bedrooms: number;
  counts: TravellerCounts;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

export function mapVillaFormToAppRequest(input: VillaFormSubmitInput): AppRequest {
  const destination = input.destination.trim();
  const checkInIso = formatIsoDate(input.checkIn);
  const checkOutIso = formatIsoDate(input.checkOut);
  const when = formatDateRangeLabel(input.checkIn, input.checkOut);
  const bedrooms = Math.max(1, Math.floor(input.bedrooms));
  const bedroomsLabel = `${bedrooms} Bedroom${bedrooms === 1 ? '' : 's'}`;
  const guestLabel = formatTravellerCountLabel(input.counts);

  const remarkLines = [
    `Guests: ${guestLabel}`,
    `Bedrooms: ${bedroomsLabel}`,
    checkInIso ? `Check-in: ${checkInIso}` : null,
    checkOutIso ? `Check-out: ${checkOutIso}` : null,
    input.placeId ? `placeId: ${input.placeId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'villa',
    main: destination,
    when,
    extra: bedroomsLabel,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      category: destination,
      destinationCity: destination,
      travelDate: when,
      checkInDate: checkInIso,
      checkOutDate: checkOutIso,
      bedrooms,
      route: bedroomsLabel,
      adults: input.counts.adults,
      children: input.counts.children,
      infants: input.counts.infants,
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
  };
}
