/**
 * Map travellers-list failures to short, user-facing copy for Profile → Travellers.
 */

export type TravellersLoadErrorKind = 'missing_scope' | 'permission' | 'offline' | 'unknown';

export function classifyTravellersLoadError(error: unknown): TravellersLoadErrorKind {
  if (!(error instanceof Error) && typeof error !== 'object') {
    return 'unknown';
  }

  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code.toLowerCase()
      : '';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const blob = `${code} ${message}`;

  if (
    blob.includes('missing_scope') ||
    blob.includes('missing admin') ||
    blob.includes('missing client')
  ) {
    return 'missing_scope';
  }

  if (
    blob.includes('permission-denied') ||
    blob.includes('permission_denied') ||
    blob.includes('missing or insufficient permissions')
  ) {
    return 'permission';
  }

  if (
    blob.includes('unavailable') ||
    blob.includes('deadline-exceeded') ||
    blob.includes('deadline_exceeded') ||
    blob.includes('timeout') ||
    blob.includes('offline') ||
    blob.includes('network') ||
    blob.includes('failed to get document')
  ) {
    return 'offline';
  }

  return 'unknown';
}

/** Concise copy for the existing Travellers error card. */
export function mapTravellersLoadErrorToMessage(error: unknown): string {
  switch (classifyTravellersLoadError(error)) {
    case 'missing_scope':
      return 'Account details are missing. Please sign in again.';
    case 'permission':
      return 'You don’t have access to travellers for this account.';
    case 'offline':
      return 'Connection issue. Check your network and try again.';
    default:
      return 'Couldn’t load travellers. Please try again.';
  }
}
