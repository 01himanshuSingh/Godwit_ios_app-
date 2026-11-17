/**
 * Map Trips list/detail load failures to short client-facing copy.
 */

export type TripsLoadErrorKind = 'missing_scope' | 'auth' | 'permission' | 'offline' | 'unknown';

export function classifyTripsLoadError(error: unknown): TripsLoadErrorKind {
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
    blob.includes('missing client') ||
    blob.includes('adminid and clientid are required')
  ) {
    return 'missing_scope';
  }

  if (
    blob.includes('unauthenticated') ||
    blob.includes('auth/user-token-expired') ||
    blob.includes('auth/id-token-expired') ||
    blob.includes('auth/invalid-user-token') ||
    blob.includes('session expired') ||
    blob.includes('token expired')
  ) {
    return 'auth';
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

/** Concise copy for Trips list / detail error surfaces. */
export function mapTripsLoadErrorToMessage(error: unknown): string {
  switch (classifyTripsLoadError(error)) {
    case 'missing_scope':
      return 'Account details are missing. Please sign in again.';
    case 'auth':
      return 'Your session has expired. Please sign in again.';
    case 'permission':
      return 'You don’t have access to trips for this account.';
    case 'offline':
      return 'Connection issue. Check your network and try again.';
    default:
      return 'Couldn’t load trips. Please try again.';
  }
}
