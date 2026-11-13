/**
 * Hotel UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import { formatDateRangeLabel, formatIsoDate } from '@/features/requests/shared/formDateUtils';
import {
  formatTravellerCountLabel,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';

/** @deprecated Prefer TravellerCounts from shared/travellerCounts */
export type HotelTravellerCounts = TravellerCounts;

export type HotelFormSubmitInput = {
  city: string;
  placeId?: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  preferredHotel?: string;
  preferredHotelBrandId?: string | null;
  counts: TravellerCounts;
  roomCount: number;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

export { formatTravellerCountLabel };

export function mapHotelFormToAppRequest(input: HotelFormSubmitInput): AppRequest {
  const city = input.city.trim();
  const checkInIso = formatIsoDate(input.checkIn);
  const checkOutIso = formatIsoDate(input.checkOut);
  const when = formatDateRangeLabel(input.checkIn, input.checkOut);
  const guestLabel = formatTravellerCountLabel(input.counts);
  const roomCount = Math.max(0, Math.floor(input.roomCount));
  const roomsLabel = `${roomCount} Room${roomCount === 1 ? '' : 's'}`;
  const preferredHotel = (input.preferredHotel || '').trim();
  const preferredHotelBrandId = (input.preferredHotelBrandId || '').trim();

  const remarkLines = [
    `Guests: ${guestLabel}`,
    `Rooms: ${roomsLabel}`,
    preferredHotel ? `Preferred hotel: ${preferredHotel}` : null,
    preferredHotelBrandId ? `preferredHotelBrandId: ${preferredHotelBrandId}` : null,
    checkInIso ? `Check-in: ${checkInIso}` : null,
    checkOutIso ? `Check-out: ${checkOutIso}` : null,
    input.placeId ? `placeId: ${input.placeId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'hotel',
    main: city,
    when,
    extra: roomsLabel,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      destinationCity: city,
      travelDate: when,
      checkInDate: checkInIso,
      checkOutDate: checkOutIso,
      adults: input.counts.adults,
      children: input.counts.children,
      infants: input.counts.infants,
      roomCount,
      category: guestLabel,
      route: roomsLabel,
      ...(preferredHotel ? { preferredHotel } : {}),
      ...(preferredHotelBrandId ? { preferredHotelBrandId } : {}),
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
  };
}
