/**
 * Something else UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import { formatDateRangeLabel, formatIsoDate } from '@/features/requests/shared/formDateUtils';
import {
  formatTravellerCountLabel,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';

export type SomethingElseFormSubmitInput = {
  city: string;
  placeId?: string | null;
  whenStart: Date | null;
  whenEnd: Date | null;
  counts: TravellerCounts;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

export function mapSomethingElseFormToAppRequest(input: SomethingElseFormSubmitInput): AppRequest {
  const city = input.city.trim();
  const when = formatDateRangeLabel(input.whenStart, input.whenEnd);
  const guestLabel = formatTravellerCountLabel(input.counts);

  const remarkLines = [
    `Guests: ${guestLabel}`,
    formatIsoDate(input.whenStart) ? `From: ${formatIsoDate(input.whenStart)}` : null,
    formatIsoDate(input.whenEnd) ? `Until: ${formatIsoDate(input.whenEnd)}` : null,
    input.placeId ? `placeId: ${input.placeId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'other',
    main: city,
    when,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      category: city,
      destinationCity: city,
      travelDate: when,
      adults: input.counts.adults,
      children: input.counts.children,
      infants: input.counts.infants,
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
  };
}
