/**
 * Replaces Expo Router’s default “Unmatched Route” screen.
 * Magic-link deep links are rewritten in `+native-intent`; this is a safe fallback.
 */
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import { useAuth } from '@/auth/providers/AuthProvider';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

function looksLikeMagicLink(url: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('__/auth') ||
    url.includes('oobCode') ||
    url.includes('mode=signIn') ||
    url.includes('finishSignIn')
  );
}

export default function NotFoundScreen() {
  const { session, pendingAuth } = useAuth();
  const [magicLink, setMagicLink] = useState(false);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      setMagicLink(looksLikeMagicLink(url));
    });
  }, []);

  const signedIn = Boolean(session?.clientId?.trim());
  const waiting = Boolean(pendingAuth?.email) || magicLink;

  if (signedIn) {
    return <Redirect href="/" />;
  }

  if (waiting) {
    return <Redirect href="/(auth)/complete-login" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.body}>Returning you to sign in.</Text>
        <Redirect href="/(auth)/sign-in" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 22,
    color: colors.forest,
    marginBottom: 8,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
