import type { ExpoConfig, ConfigContext } from 'expo/config';

type AppEnv = 'development' | 'staging' | 'production';

function resolveAppEnv(): AppEnv {
  const value = process.env.APP_ENV ?? 'development';
  if (value === 'development' || value === 'staging' || value === 'production') {
    return value;
  }
  throw new Error(`Invalid APP_ENV "${value}". Expected development, staging, or production.`);
}

function iosBundleIdentifier(appEnv: AppEnv): string {
  // TODO confirm with Apple Developer account
  switch (appEnv) {
    case 'production':
      return 'com.godwit.client';
    case 'staging':
      return 'com.godwit.client.staging';
    case 'development':
      return 'com.godwit.client.dev';
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = resolveAppEnv();
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://example.invalid/v1';

  return {
    ...config,
    name: 'Godwit',
    slug: 'godwit-client-ios',
    scheme: 'godwit',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    platforms: ['ios'],
    icon: './assets/icon.png',
    ios: {
      supportsTablet: false,
      bundleIdentifier: iosBundleIdentifier(appEnv),
      usesAppleSignIn: true,
      infoPlist: {
        // Confirm before first App Store submission (export compliance).
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          'Godwit needs access to your photo library so you can attach images to messages and upload travel documents.',
        NSCameraUsageDescription:
          'Godwit needs camera access so you can capture photos for message attachments and document uploads.',
      },
      // TODO: Required-reason API declarations — verify what the installed SDK already ships
      // and complete entries per docs/APP_STORE_CHECKLIST.md (Apple privacy manifests).
      // privacyManifests: { ... },
    },
    experiments: {
      typedRoutes: true,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-apple-authentication',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
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
      // TODO Day 3: Register @react-native-google-signin/google-signin with iOS URL scheme and
      // Google OAuth iOS client ID from Google Cloud Console (never commit secrets).
      // TODO Day 3: Register @sentry/react-native with organization, project, and DSN via EAS secrets.
    ],
    extra: {
      appEnv,
      apiBaseUrl,
      // TODO: Set eas.projectId after `eas init` — required for EAS Build and push.
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
      router: {},
    },
  };
};
