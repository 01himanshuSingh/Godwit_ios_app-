/**
 * Map Documents tab load/open failures to short Profile UI copy.
 * Only app-relevant cases (client-scoped list + open/download).
 */

export type DocumentsLoadErrorKind = 'missing_scope' | 'permission' | 'offline' | 'unknown';

export type DocumentsSurface = 'trips' | 'personal' | 'file';

export function classifyDocumentsLoadError(error: unknown): DocumentsLoadErrorKind {
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
    blob.includes('missing or insufficient permissions') ||
    blob.includes('storage/unauthorized') ||
    blob.includes('403')
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

/** List-load copy for Trips / Personal tabs. */
export function mapDocumentsLoadErrorToMessage(
  error: unknown,
  surface: DocumentsSurface = 'trips',
): string {
  const kind = classifyDocumentsLoadError(error);

  if (kind === 'missing_scope') {
    return 'Account details are missing. Please sign in again.';
  }
  if (kind === 'permission') {
    return surface === 'personal'
      ? 'You don’t have access to personal documents for this account.'
      : 'You don’t have access to trip documents for this account.';
  }
  if (kind === 'offline') {
    return 'Connection issue. Check your network and try again.';
  }

  return surface === 'personal'
    ? 'Couldn’t load personal documents. Please try again.'
    : 'Couldn’t load trip documents. Please try again.';
}

/** View / Download action copy (Alerts). */
export function mapDocumentFileErrorToMessage(error: unknown, action: 'open' | 'download'): string {
  const kind = classifyDocumentsLoadError(error);

  if (kind === 'permission') {
    return 'This file isn’t available to open.';
  }
  if (kind === 'offline') {
    return 'Connection issue. Check your network and try again.';
  }

  return action === 'download'
    ? 'Couldn’t download this file. Please try again.'
    : 'Couldn’t open this file. Please try again.';
}
