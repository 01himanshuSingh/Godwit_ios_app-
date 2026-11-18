/**
 * Map traveller-detail failures to short, user-facing copy.
 * Never surfaces adminId, customerId, or raw Firestore/API payloads.
 */

export type TravellerDetailLoadErrorKind =
  'missing_scope' | 'auth' | 'permission' | 'offline' | 'not_found' | 'unknown';

export function classifyTravellerDetailLoadError(error: unknown): TravellerDetailLoadErrorKind {
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
    blob.includes('adminid or clientid') ||
    blob.includes('adminid or customerid')
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
    blob.includes('not-found') ||
    blob.includes('not_found') ||
    blob.includes('traveller not found') ||
    blob.includes('no such document') ||
    blob.includes('does not exist')
  ) {
    return 'not_found';
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

/**
 * Concise client-facing copy for traveller detail exceptions.
 */
export function mapTravellerDetailLoadErrorToMessage(error: unknown): string {
  switch (classifyTravellerDetailLoadError(error)) {
    case 'missing_scope':
    case 'auth':
      return 'Account details are missing. Please sign in again.';
    case 'permission':
      return 'You don’t have access to this traveller.';
    case 'offline':
      return 'Connection issue. Check your network and try again.';
    case 'not_found':
      return 'This traveller couldn’t be found.';
    default:
      return 'Couldn’t load this traveller. Please try again.';
  }
}
