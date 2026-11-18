/**
 * Map Profile hub load failures to short client-facing copy.
 * Never invents another guest’s identity — message only.
 */

export type ProfileLoadErrorKind =
  'missing_scope' | 'auth' | 'permission' | 'offline' | 'not_found' | 'unknown';

export function classifyProfileLoadError(error: unknown): ProfileLoadErrorKind {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code.toLowerCase()
      : '';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();
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
    blob.includes('not found') ||
    blob.includes('client not found') ||
    blob.includes('no such document')
  ) {
    return 'not_found';
  }

  if (
    blob.includes('unavailable') ||
    blob.includes('deadline-exceeded') ||
    blob.includes('timeout') ||
    blob.includes('offline') ||
    blob.includes('network') ||
    blob.includes('failed to get document')
  ) {
    return 'offline';
  }

  return 'unknown';
}

export function mapProfileLoadErrorToMessage(error: unknown): string {
  switch (classifyProfileLoadError(error)) {
    case 'missing_scope':
      return 'Account details are missing. Please sign in again.';
    case 'auth':
      return 'Your session has expired. Please sign in again.';
    case 'permission':
      return 'You don’t have access to this profile.';
    case 'not_found':
      return 'We couldn’t find a profile for this account.';
    case 'offline':
      return 'Connection issue. Check your network and try again.';
    default:
      return 'Couldn’t load profile. Please try again.';
  }
}
