import { EnquirySubmitError } from './EnquirySubmitError';

export function mapEnquirySubmitErrorToMessage(error: unknown): string {
  if (error instanceof EnquirySubmitError) {
    return error.message;
  }

  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const lower = `${code} ${raw}`.toLowerCase();

  if (lower.includes('permission') || lower.includes('insufficient')) {
    return 'You don’t have permission to send this request. Please sign in again.';
  }
  if (
    lower.includes('offline') ||
    lower.includes('unavailable') ||
    lower.includes('network') ||
    lower.includes('failed to get document')
  ) {
    return 'Connection issue. Check your network and try again.';
  }
  if (lower.includes('missing_scope') || lower.includes('adminid') || lower.includes('clientid')) {
    return 'Your session is missing client details. Please sign out and sign in again.';
  }

  return 'We couldn’t send your request. Please try again.';
}
