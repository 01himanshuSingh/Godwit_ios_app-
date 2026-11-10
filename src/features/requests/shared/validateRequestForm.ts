/**
 * Shared request-form validation — collect field errors, then show inline + alert.
 */
import { isValid, startOfDay } from 'date-fns';

import type { TravellerCounts } from '@/features/requests/shared/travellerCounts';

export type FieldErrors = Record<string, string>;

export function firstFieldError(errors: FieldErrors): string | null {
  for (const message of Object.values(errors)) {
    if (message.trim()) return message.trim();
  }
  return null;
}

export function requireText(
  value: string,
  label: string,
  options: { minLength?: number } = {},
): string | null {
  const trimmed = value.trim();
  const minLength = options.minLength ?? 2;
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < minLength) return `Enter a valid ${label.toLowerCase()}.`;
  return null;
}

export function requireDate(value: Date | null, label: string): string | null {
  if (!value || !isValid(value)) return `${label} is required.`;
  return null;
}

/** Calendar dates must be today or later (time-of-day ignored). */
export function requireDateOnOrAfterToday(value: Date | null, label: string): string | null {
  const missing = requireDate(value, label);
  if (missing) return missing;
  if (startOfDay(value!).getTime() < startOfDay(new Date()).getTime()) {
    return `${label} can’t be in the past.`;
  }
  return null;
}

/** Date-times must be now or later. */
export function requireDateTimeOnOrAfterNow(value: Date | null, label: string): string | null {
  const missing = requireDate(value, label);
  if (missing) return missing;
  if (value!.getTime() < Date.now() - 60_000) {
    return `${label} can’t be in the past.`;
  }
  return null;
}

export function requireEndOnOrAfterStart(
  start: Date | null,
  end: Date | null,
  endLabel: string,
  startLabel: string,
): string | null {
  if (!start || !end || !isValid(start) || !isValid(end)) return null;
  if (end.getTime() < start.getTime()) {
    return `${endLabel} must be on or after ${startLabel.toLowerCase()}.`;
  }
  return null;
}

/** At least one adult — infants/children alone are not a valid booking party. */
export function requireTravellerParty(counts: TravellerCounts): string | null {
  if (counts.adults < 1) return 'Add at least one adult.';
  if (counts.adults + counts.children + counts.infants < 1) {
    return 'Add at least one traveller.';
  }
  return null;
}

export function requirePositiveCount(value: number, label: string, min = 1): string | null {
  if (!Number.isFinite(value) || value < min) {
    return `${label} must be at least ${min}.`;
  }
  return null;
}

export function requireDistinctPlaces(
  from: string,
  to: string,
  fromLabel = 'Flying from',
  toLabel = 'Flying to',
): string | null {
  const a = from.trim().toLowerCase();
  const b = to.trim().toLowerCase();
  if (a && b && a === b) {
    return `${fromLabel} and ${toLabel.toLowerCase()} can’t be the same.`;
  }
  return null;
}

export function setError(errors: FieldErrors, key: string, message: string | null): void {
  if (message) errors[key] = message;
}
