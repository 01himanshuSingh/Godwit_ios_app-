/**
 * Fail fast when Firestore hangs (common on Expo Go / flaky mobile networks).
 * Default Firestore "backend didn't respond" is ~10s; retries can multiply that.
 */

export class FirestoreTimeoutError extends Error {
  readonly code = 'deadline-exceeded';

  constructor(label: string, timeoutMs: number) {
    super(`Firestore timed out after ${timeoutMs}ms (${label})`);
    this.name = 'FirestoreTimeoutError';
  }
}

export async function withFirestoreTimeout<T>(
  label: string,
  fn: () => Promise<T>,
  timeoutMs: number = 12_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new FirestoreTimeoutError(label, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
