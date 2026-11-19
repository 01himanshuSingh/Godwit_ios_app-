/**
 * Rewrite third-party deep links before Expo Router matches a page.
 * Firebase email magic links open as `godwit:///__/auth/links?link=…`
 * which is not an app route — without this, users see "Unmatched Route".
 *
 * Auth completion still runs via `useMagicLinkHandler` (Linking URL events).
 */
function isFirebaseAuthDeepLink(path: string): boolean {
  const value = path.trim();
  if (!value) return false;
  return (
    value.includes('__/auth') ||
    value.includes('finishSignIn') ||
    value.includes('oobCode') ||
    value.includes('mode=signIn') ||
    value.includes('auth/action')
  );
}

export function redirectSystemPath({
  path,
  initial: _initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    if (isFirebaseAuthDeepLink(path)) {
      // Stay on the waiting / complete-login surface while Linking completes sign-in.
      return '/(auth)/complete-login';
    }
    return path;
  } catch {
    return '/(auth)/sign-in';
  }
}
