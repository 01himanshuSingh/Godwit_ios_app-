/**
 * Flight UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import {
  formatDateRangeLabel,
  formatDisplayDate,
  formatIsoDate,
} from '@/features/requests/shared/formDateUtils';
import {
  formatTravellerCountLabel,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';

export type FlightTripType = 'one_way' | 'round_trip';

export type FlightFormSubmitInput = {
  tripType: FlightTripType;
  flyingFrom: string;
  fromPlaceId?: string | null;
  flyingTo: string;
  toPlaceId?: string | null;
  departure: Date | null;
  returnDate: Date | null;
  preferredAirline?: string;
  preferredAirlineId?: string | null;
  preferredAirlineCode?: string | null;
  cabinClass: string;
  counts: TravellerCounts;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

function tripTypeLabel(tripType: FlightTripType): string {
  switch (tripType) {
    case 'one_way':
      return 'One Way';
    case 'round_trip':
      return 'Round Trip';
    default:
      return tripType;
  }
}

export function mapFlightFormToAppRequest(input: FlightFormSubmitInput): AppRequest {
  const from = input.flyingFrom.trim();
  const to = input.flyingTo.trim();
  const route = from && to ? `${from} → ${to}` : from || to;
  const departureIso = formatIsoDate(input.departure);
  const returnIso = formatIsoDate(input.returnDate);
  const when =
    input.tripType === 'one_way'
      ? formatDisplayDate(input.departure) || 'Dates to be confirmed'
      : formatDateRangeLabel(input.departure, input.returnDate);
  const guestLabel = formatTravellerCountLabel(input.counts);
  const cabin = input.cabinClass.trim();
  const airline = (input.preferredAirline || '').trim();
  const airlineId = (input.preferredAirlineId || '').trim();
  const airlineCode = (input.preferredAirlineCode || '').trim();
  const tripLabel = tripTypeLabel(input.tripType);

  const remarkLines = [
    `Trip type: ${tripLabel}`,
    `Guests: ${guestLabel}`,
    cabin ? `Cabin: ${cabin}` : null,
    airline ? `Preferred airline: ${airline}` : null,
    airlineId ? `preferredAirlineId: ${airlineId}` : null,
    airlineCode ? `preferredAirlineCode: ${airlineCode}` : null,
    departureIso ? `Departure: ${departureIso}` : null,
    returnIso && input.tripType !== 'one_way' ? `Return: ${returnIso}` : null,
    input.fromPlaceId ? `fromPlaceId: ${input.fromPlaceId}` : null,
    input.toPlaceId ? `toPlaceId: ${input.toPlaceId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'flight',
    main: route,
    when,
    extra: cabin || guestLabel,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      route,
      travelDate: when,
      cabinClass: cabin,
      tripType: tripLabel,
      flyingFrom: from,
      flyingTo: to,
      departureDate: departureIso,
      ...(returnIso && input.tripType !== 'one_way' ? { returnDate: returnIso } : {}),
      adults: input.counts.adults,
      children: input.counts.children,
      infants: input.counts.infants,
      category: guestLabel,
      ...(airline ? { preferredAirline: airline } : {}),
      ...(airlineId ? { preferredAirlineId: airlineId } : {}),
      ...(airlineCode ? { preferredAirlineCode: airlineCode } : {}),
      ...(input.fromPlaceId ? { fromPlaceId: input.fromPlaceId } : {}),
      ...(input.toPlaceId ? { toPlaceId: input.toPlaceId } : {}),
    },
  };
}
