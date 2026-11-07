import type { ActionCodeSettings } from '@/lib/firebase/firebaseAuth';

/**
 * Firebase email-link continue URL — must be an Authorized domain.
 * Copy/paste Expo Go flow does not require `iOS.bundleId` (which fails if the bundleId
 * is not registered in Firebase Project Settings).
 */
export function getMagicLinkActionCodeSettings(): ActionCodeSettings {
  const authDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || 'debug-godwit-3bd83.firebaseapp.com';

  return {
    url: `https://${authDomain}/finishSignIn`,
    handleCodeInApp: true,
  };
}
