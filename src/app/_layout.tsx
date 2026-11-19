import 'react-native-gesture-handler';

import { Stack, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '@/auth/components/AuthGate';
import { AppChromeHeader } from '@/features/home/components/AppChromeHeader';
import { AppProviders } from '@/providers/AppProviders';
import { GodwitBootGate } from '@/ui/boot/GodwitBootGate';
import { colors } from '@/ui/tokens/colors';

/**
 * Root shell: GODWIT chrome header on every authenticated surface.
 * Auth routes ((auth)/*) stay full-bleed without the app header.
 * Cold start: GodwitBootGate overlays bird splash until fonts + session hydrate.
 */
function RootNavigation() {
  const segments = useSegments();
  const hideChrome = segments[0] === '(auth)' || segments[0] === 'document-viewer';

  return (
    <AuthGate>
      <View style={styles.root}>
        {hideChrome ? null : <AppChromeHeader />}
        <View style={styles.stack}>
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.stackContent }}>
            <Stack.Screen
              name="document-viewer"
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            />
          </Stack>
        </View>
      </View>
    </AuthGate>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <GodwitBootGate>
        <RootNavigation />
      </GodwitBootGate>
    </AppProviders>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorRoot}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Pressable onPress={retry} style={styles.pressable}>
        <View style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Retry</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stack: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: colors.background,
  },
  errorRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: colors.forest,
  },
  pressable: {},
  errorButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.forest,
  },
  errorButtonText: {
    color: colors.primaryForeground,
  },
});
