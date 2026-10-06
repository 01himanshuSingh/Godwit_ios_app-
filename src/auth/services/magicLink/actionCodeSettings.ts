import Constants from 'expo-constants';

/** Deep-link settings sent to the BFF so the email link opens this app (Firebase-style shape for server reuse). */
export type MagicLinkActionCodeSettings = {
  url: string;
  handleCodeInApp: true;
  iOS: {
    bundleId: string;
  };
};

export function getMagicLinkActionCodeSettings(): MagicLinkActionCodeSettings {
  const scheme = Constants.expoConfig?.scheme ?? 'godwit';
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.godwit.client.dev';

  return {
    url: `${scheme}://auth/magic-link`,
    handleCodeInApp: true,
    iOS: { bundleId },
  };
}
