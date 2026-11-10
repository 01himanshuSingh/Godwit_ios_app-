/**
 * Private jet UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import {
  formatDateRangeLabel,
  formatDisplayDate,
  formatIsoDate,
} from '@/features/requests/shared/formDateUtils';

export type PrivateJetTripType = 'one_way' | 'round_trip';

export type PrivateJetFormSubmitInput = {
  tripType: PrivateJetTripType;
  flyingFrom: string;
  fromPlaceId?: string | null;
  flyingTo: string;
  toPlaceId?: string | null;
  departure: Date | null;
  returnDate: Date | null;
  passengers: number;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

function tripTypeLabel(tripType: PrivateJetTripType): string {
  switch (tripType) {
    case 'one_way':
      return 'One Way';
    case 'round_trip':
      return 'Round Trip';
    default:
      return tripType;
  }
}

export function mapPrivateJetFormToAppRequest(input: PrivateJetFormSubmitInput): AppRequest {
  const from = input.flyingFrom.trim();
  const to = input.flyingTo.trim();
  const route = from && to ? `${from} → ${to}` : from || to;
  const departureIso = formatIsoDate(input.departure);
  const returnIso = formatIsoDate(input.returnDate);
  const when =
    input.tripType === 'one_way'
      ? formatDisplayDate(input.departure) || 'Dates to be confirmed'
      : formatDateRangeLabel(input.departure, input.returnDate);
  const passengers = Math.max(1, Math.floor(input.passengers));
  const passengersLabel = `${passengers} Passenger${passengers === 1 ? '' : 's'}`;
  const tripLabel = tripTypeLabel(input.tripType);

  const remarkLines = [
    `Trip type: ${tripLabel}`,
    `Passengers: ${passengersLabel}`,
    departureIso ? `Departure: ${departureIso}` : null,
    returnIso && input.tripType !== 'one_way' ? `Return: ${returnIso}` : null,
    input.fromPlaceId ? `fromPlaceId: ${input.fromPlaceId}` : null,
    input.toPlaceId ? `toPlaceId: ${input.toPlaceId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'private_jet',
    main: route,
    when,
    extra: passengersLabel,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      route,
      travelDate: when,
      tripType: tripLabel,
      flyingFrom: from,
      flyingTo: to,
      departureDate: departureIso,
      ...(returnIso && input.tripType !== 'one_way' ? { returnDate: returnIso } : {}),
      passengers,
      category: passengersLabel,
      ...(input.fromPlaceId ? { fromPlaceId: input.fromPlaceId } : {}),
      ...(input.toPlaceId ? { toPlaceId: input.toPlaceId } : {}),
    },
  };
}
