import Constants from 'expo-constants';

import type { ActionCodeSettings } from '@/lib/firebase/firebaseAuth';

function firebaseAuthDomain(): string {
  return (
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || 'debug-godwit-3bd83.firebaseapp.com'
  );
}

/**
 * Firebase email-link settings for native APK/IPA.
 *
 * - `handleCodeInApp: true` + `android.packageName` → tap in Gmail opens the installed app
 *   (Firebase Hosting / App Link), not a paste UI.
 * - Continue URL domain must stay in Firebase Console → Authentication → Authorized domains.
 * - Register each Android package (dev / staging / production) on the same Firebase project
 *   the CRM uses, then rebuild the APK.
 */
export function getMagicLinkActionCodeSettings(): ActionCodeSettings {
  const authDomain = firebaseAuthDomain();
  const androidPackageName = Constants.expoConfig?.android?.package?.trim();
  const iosBundleId = Constants.expoConfig?.ios?.bundleIdentifier?.trim();

  const settings: ActionCodeSettings = {
    // Fallback / web continue URL (authorized domain). Mobile opens via App Link when package is set.
    url: `https://${authDomain}/finishSignIn`,
    handleCodeInApp: true,
  };

  if (androidPackageName) {
    settings.android = {
      packageName: androidPackageName,
      installApp: true,
      minimumVersion: '1',
    };
  }

  if (iosBundleId) {
    settings.iOS = {
      bundleId: iosBundleId,
    };
  }

  return settings;
}

/** Hosts that deliver Firebase email-action / Hosting links into the app. */
export function getFirebaseAuthLinkHosts(): string[] {
  const authDomain = firebaseAuthDomain();
  const projectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    authDomain.replace(/\.firebaseapp\.com$/i, '').replace(/\.web\.app$/i, '');

  return Array.from(
    new Set([authDomain, `${projectId}.firebaseapp.com`, `${projectId}.web.app`].filter(Boolean)),
  );
}
