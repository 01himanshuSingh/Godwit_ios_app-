/**
 * Shared date formatting for request → CRM mapping.
 */
import { format, isValid } from 'date-fns';

export function formatIsoDate(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'd MMMM yyyy');
}

export function formatDisplayDateTime(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'd MMMM yyyy h:mm a');
}

export function formatIsoDateTime(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatDisplayTime(date: Date | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'h:mm a');
}

export function formatDateRangeLabel(start: Date | null, end: Date | null): string {
  const startLabel = formatDisplayDate(start);
  const endLabel = formatDisplayDate(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  if (startLabel) return `From ${startLabel}`;
  if (endLabel) return `Until ${endLabel}`;
  return 'Dates to be confirmed';
}
