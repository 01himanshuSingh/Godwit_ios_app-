/**
 * Airport VIP UI → universal AppRequest (+ CRM prefill keys).
 * serviceType matches CRM Instant Sale walkIn.serviceType (Arrival / Departure / Transit).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import { formatDateRangeLabel, formatIsoDate } from '@/features/requests/shared/formDateUtils';
import {
  formatTravellerCountLabel,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';

export type AirportVipFormSubmitInput = {
  airport: string;
  placeId?: string | null;
  serviceStart: Date | null;
  serviceEnd: Date | null;
  serviceType: string;
  counts: TravellerCounts;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

export function mapAirportVipFormToAppRequest(input: AirportVipFormSubmitInput): AppRequest {
  const airport = input.airport.trim();
  const when = formatDateRangeLabel(input.serviceStart, input.serviceEnd);
  const serviceType = input.serviceType.trim();
  const guestLabel = formatTravellerCountLabel(input.counts);

  const remarkLines = [
    serviceType ? `Service type: ${serviceType}` : null,
    `Guests: ${guestLabel}`,
    formatIsoDate(input.serviceStart)
      ? `Service start: ${formatIsoDate(input.serviceStart)}`
      : null,
    formatIsoDate(input.serviceEnd) ? `Service end: ${formatIsoDate(input.serviceEnd)}` : null,
    input.placeId ? `placeId: ${input.placeId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'airport_vip',
    main: airport,
    when,
    extra: serviceType,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      destinationCity: airport,
      travelDate: when,
      // Same field CRM Instant Sale uses for VIP Service Type
      serviceType,
      serviceStartDate: formatIsoDate(input.serviceStart),
      serviceEndDate: formatIsoDate(input.serviceEnd),
      adults: input.counts.adults,
      children: input.counts.children,
      infants: input.counts.infants,
      category: guestLabel,
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
  };
}
