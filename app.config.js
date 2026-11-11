/**
 * Dynamic Expo config (used instead of a full app.json).
 * Plain JS so EAS CLI can read/write `extra.eas.projectId` without TS parse errors.
 */

function resolveAppEnv() {
  const value = process.env.APP_ENV ?? 'development';
  if (value === 'development' || value === 'staging' || value === 'production') {
    return value;
  }
  throw new Error(`Invalid APP_ENV "${value}". Expected development, staging, or production.`);
}

function iosBundleIdentifier(appEnv) {
  switch (appEnv) {
    case 'production':
      return 'com.godwit.client';
    case 'staging':
      return 'com.godwit.client.staging';
    case 'development':
      return 'com.godwit.client.dev';
    default:
      return 'com.godwit.client.dev';
  }
}

/** Android applicationId — permanent after Play Store publish. */
function androidPackage(appEnv) {
  switch (appEnv) {
    case 'production':
      return 'com.godwit.client';
    case 'staging':
      return 'com.godwit.client.staging';
    case 'development':
      return 'com.godwit.client.dev';
    default:
      return 'com.godwit.client.dev';
  }
}

module.exports = ({ config }) => {
  const appEnv = resolveAppEnv();
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://example.invalid/v1';
  // Linked EAS project: @ascentia-labs/godwit-client-ios
  const easProjectId =
    process.env.EAS_PROJECT_ID ||
    (config && config.extra && config.extra.eas && config.extra.eas.projectId) ||
    'cdbe68dc-e1dc-478b-b230-19171169ede8';

  const firebaseProjectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() || 'debug-godwit-3bd83';
  const firebaseAuthDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || `${firebaseProjectId}.firebaseapp.com`;
  const firebaseLinkHosts = Array.from(
    new Set([
      firebaseAuthDomain,
      `${firebaseProjectId}.firebaseapp.com`,
      `${firebaseProjectId}.web.app`,
    ]),
  );

  // Android App Links so Gmail "tap sign-in" opens this APK (Firebase email-link / Hosting URL).
  const firebaseAuthIntentFilters = firebaseLinkHosts.map((host) => ({
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: [
      {
        scheme: 'https',
        host,
        pathPrefix: '/__/auth',
      },
      {
        scheme: 'https',
        host,
        pathPrefix: '/finishSignIn',
      },
    ],
  }));

  return {
    ...config,
    name: 'Godwit',
    slug: 'godwit-client-ios',
    scheme: 'godwit',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    platforms: ['ios', 'android'],
    icon: './assets/icon.png',
    ios: {
      supportsTablet: false,
      bundleIdentifier: iosBundleIdentifier(appEnv),
      usesAppleSignIn: true,
      associatedDomains: firebaseLinkHosts.map((host) => `applinks:${host}`),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          'Godwit needs access to your photo library so you can attach images to messages and upload travel documents.',
        NSCameraUsageDescription:
          'Godwit needs camera access so you can capture photos for message attachments and document uploads.',
      },
    },
    android: {
      package: androidPackage(appEnv),
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#FFFFFF',
      },
      softwareKeyboardLayoutMode: 'resize',
      intentFilters: [
        ...firebaseAuthIntentFilters,
        {
          action: 'VIEW',
          category: ['BROWSABLE', 'DEFAULT'],
          data: [{ scheme: 'godwit' }],
        },
      ],
    },
    experiments: {
      typedRoutes: true,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-apple-authentication',
      'expo-font',
      'expo-image',
      'expo-sharing',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
          android: {
            minSdkVersion: 24,
          },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Godwit needs access to your photo library so you can attach images to messages and upload travel documents.',
          cameraPermission:
            'Godwit needs camera access so you can capture photos for message attachments and document uploads.',
        },
      ],
      'expo-notifications',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    extra: {
      ...(config && typeof config.extra === 'object' && config.extra ? config.extra : {}),
      appEnv,
      apiBaseUrl,
      eas: {
        projectId: easProjectId,
      },
      router: {},
    },
  };
};
