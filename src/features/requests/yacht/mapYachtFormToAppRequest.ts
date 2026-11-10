/**
 * Yacht UI → universal AppRequest (+ CRM prefill keys).
 */

import type { AppRequest, AppRequestTraveller } from '@/lib/firebase/enquiries';
import {
  formatDateRangeLabel,
  formatDisplayTime,
  formatIsoDate,
} from '@/features/requests/shared/formDateUtils';

export type YachtFormSubmitInput = {
  destination: string;
  placeId?: string | null;
  charterStart: Date | null;
  charterEnd: Date | null;
  duration: Date | null;
  durationFlexible: boolean;
  charterType: string;
  guests: number;
  notes: string;
  travellerIds: string[];
  travellers: AppRequestTraveller[];
};

export function mapYachtFormToAppRequest(input: YachtFormSubmitInput): AppRequest {
  const destination = input.destination.trim();
  const startIso = formatIsoDate(input.charterStart);
  const endIso = formatIsoDate(input.charterEnd);
  const when = formatDateRangeLabel(input.charterStart, input.charterEnd);
  const durationLabel = input.durationFlexible
    ? 'Flexible'
    : formatDisplayTime(input.duration) || 'Flexible';
  const charterType = input.charterType.trim() || 'Private';
  const guests = Math.max(1, Math.floor(input.guests));
  const guestsLabel = `${guests} Guest${guests === 1 ? '' : 's'}`;

  const remarkLines = [
    `Charter type: ${charterType}`,
    `Duration: ${durationLabel}`,
    `Guests: ${guestsLabel}`,
    startIso ? `Charter start: ${startIso}` : null,
    endIso ? `Charter end: ${endIso}` : null,
    input.placeId ? `placeId: ${input.placeId}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    category: 'yacht',
    main: destination,
    when,
    extra: guestsLabel,
    notes: input.notes.trim() || undefined,
    travellerIds: input.travellerIds,
    travellers: input.travellers,
    remarkLines,
    crmFields: {
      destinationCity: destination,
      travelDate: when,
      charterStartDate: startIso,
      charterEndDate: endIso,
      duration: durationLabel,
      charterType,
      guests,
      category: guestsLabel,
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
  };
}
