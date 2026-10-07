/** Retry transient Firestore / Expo Go WebChannel failures (offline, aborted, unavailable). */

const RETRYABLE =
  /offline|unavailable|deadline|aborted|resource-exhausted|internal|network|Failed to get document/i;

export function isRetryableFirestoreError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  return RETRYABLE.test(error.message) || RETRYABLE.test(code);
}

export async function withFirestoreRetry<T>(
  label: string,
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryableFirestoreError(error);
      if (!retryable || attempt === attempts) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `[testing] ${label} attempt ${attempt}/${attempts} failed, retry in ${delay}ms:`,
        error instanceof Error ? error.message : error,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
