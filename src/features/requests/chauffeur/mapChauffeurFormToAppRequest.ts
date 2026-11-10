/**
 * Chauffeur UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import { formatDisplayDateTime, formatIsoDateTime } from '@/features/requests/shared/formDateUtils';

export type ChauffeurFormSubmitInput = {
  city: string;
  cityPlaceId?: string | null;
  serviceType: string;
  pickUp: string;
  pickUpPlaceId?: string | null;
  dropOff: string;
  dropOffPlaceId?: string | null;
  pickUpAt: Date | null;
  returnAt: Date | null;
  passengers: number;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

export function mapChauffeurFormToAppRequest(input: ChauffeurFormSubmitInput): AppRequest {
  const city = input.city.trim();
  const pickUp = input.pickUp.trim();
  const dropOff = input.dropOff.trim();
  const serviceType = input.serviceType.trim();
  const pickUpLabel = formatDisplayDateTime(input.pickUpAt);
  const returnLabel = formatDisplayDateTime(input.returnAt);
  const when =
    pickUpLabel && returnLabel
      ? `${pickUpLabel} – ${returnLabel}`
      : pickUpLabel || returnLabel || 'Dates to be confirmed';
  const passengers = Math.max(1, Math.floor(input.passengers));
  const passengersLabel = `${passengers} Passenger${passengers === 1 ? '' : 's'}`;
  const routeExtra = [pickUp, dropOff].filter(Boolean).join(' → ') || pickUp || dropOff;

  const remarkLines = [
    serviceType ? `Service type: ${serviceType}` : null,
    pickUp ? `Pick-up: ${pickUp}` : null,
    dropOff ? `Drop-off: ${dropOff}` : null,
    `Passengers: ${passengersLabel}`,
    input.pickUpAt ? `Pick-up at: ${formatIsoDateTime(input.pickUpAt)}` : null,
    input.returnAt ? `Return at: ${formatIsoDateTime(input.returnAt)}` : null,
    input.cityPlaceId ? `cityPlaceId: ${input.cityPlaceId}` : null,
    input.pickUpPlaceId ? `pickUpPlaceId: ${input.pickUpPlaceId}` : null,
    input.dropOffPlaceId ? `dropOffPlaceId: ${input.dropOffPlaceId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'car_chauffeur',
    main: city,
    when,
    extra: routeExtra || passengersLabel,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      destinationCity: city,
      travelDate: when,
      serviceType,
      pickUpLocation: pickUp,
      dropOffLocation: dropOff,
      pickUpDateTime: formatIsoDateTime(input.pickUpAt),
      returnDateTime: formatIsoDateTime(input.returnAt),
      passengers,
      route: routeExtra || passengersLabel,
      ...(input.cityPlaceId ? { cityPlaceId: input.cityPlaceId } : {}),
      ...(input.pickUpPlaceId ? { pickUpPlaceId: input.pickUpPlaceId } : {}),
      ...(input.dropOffPlaceId ? { dropOffPlaceId: input.dropOffPlaceId } : {}),
    },
  };
}
