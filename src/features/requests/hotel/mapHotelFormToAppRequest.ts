/**
 * Hotel UI → universal AppRequest (+ CRM prefill keys).
 * Keeps SERVICE_MAP main/extra/when/notes; structured hotel fields go in crmFields.
 */

import { format, isValid } from 'date-fns';

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';

export type HotelTravellerCounts = {
  adults: number;
  children: number;
  infants: number;
};

export type HotelFormSubmitInput = {
  city: string;
  placeId?: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  counts: HotelTravellerCounts;
  roomCount: number;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

function formatIsoDate(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

function formatDisplayDate(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'd MMMM yyyy');
}

export function formatTravellerCountLabel(counts: HotelTravellerCounts): string {
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

export function mapHotelFormToAppRequest(input: HotelFormSubmitInput): AppRequest {
  const city = input.city.trim();
  const checkInIso = formatIsoDate(input.checkIn);
  const checkOutIso = formatIsoDate(input.checkOut);
  const checkInLabel = formatDisplayDate(input.checkIn);
  const checkOutLabel = formatDisplayDate(input.checkOut);

  let when = 'Dates to be confirmed';
  if (checkInLabel && checkOutLabel) {
    when = `${checkInLabel} – ${checkOutLabel}`;
  } else if (checkInLabel) {
    when = `From ${checkInLabel}`;
  } else if (checkOutLabel) {
    when = `Until ${checkOutLabel}`;
  }

  const guestLabel = formatTravellerCountLabel(input.counts);
  const roomCount = Math.max(0, Math.floor(input.roomCount));
  const roomsLabel = `${roomCount} Room${roomCount === 1 ? '' : 's'}`;

  const remarkLines = [
    `Guests: ${guestLabel}`,
    `Rooms: ${roomsLabel}`,
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
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
  };
}
