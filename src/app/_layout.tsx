import '../../global.css';

import 'react-native-gesture-handler';

import { Stack, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppChromeHeader } from '@/features/home/components/AppChromeHeader';
import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/ui/tokens/colors';

/**
 * Root shell: GODWIT chrome header on every authenticated surface.
 * Auth routes ((auth)/*) stay full-bleed without the app header.
 */
function RootNavigation() {
  const segments = useSegments();
  const hideChrome = segments[0] === '(auth)';

  return (
    <View style={styles.root}>
      {hideChrome ? null : <AppChromeHeader />}
      <View style={styles.stack}>
        <Stack screenOptions={{ headerShown: false, contentStyle: styles.stackContent }} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <RootNavigation />
    </AppProviders>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorRoot}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Pressable onPress={retry} style={styles.errorButton}>
        <Text style={styles.errorButtonText}>Retry</Text>
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
  errorButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.forest,
  },
  errorButtonText: {
    color: colors.primaryForeground,
  },
});
