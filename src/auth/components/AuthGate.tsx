/**
 * Auth gate: Firebase + validated client session required for app surfaces.
 * Pending magic-link wait → complete-login (survives Expo Go reload).
 */
import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/providers/AuthProvider';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { colors } from '@/ui/tokens/colors';

const COMPLETE_LOGIN_HREF = '/(auth)/complete-login' as Href;
const SIGN_IN_HREF = '/(auth)/sign-in' as Href;

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading: authLoading, pendingAuth } = useAuth();
  const { profile, isHydrating } = useActiveClientProfile();

  const ready = !authLoading && !isHydrating;
  const signedIn = Boolean(
    session?.clientId?.trim() && profile?.clientId?.trim() && profile?.adminId?.trim(),
  );
  const inAuthGroup = segments[0] === '(auth)';
  const authScreen = String(segments[1] ?? '');
  const onCompleteLogin = inAuthGroup && authScreen === 'complete-login';
  const waitingForLink = Boolean(pendingAuth?.email);

  useEffect(() => {
    if (!ready) return;

    if (signedIn && inAuthGroup) {
      router.replace('/');
      return;
    }

    if (!signedIn && waitingForLink && !onCompleteLogin) {
      router.replace(COMPLETE_LOGIN_HREF);
      return;
    }

    if (!signedIn && !waitingForLink && !inAuthGroup) {
      router.replace(SIGN_IN_HREF);
    }
  }, [ready, signedIn, inAuthGroup, waitingForLink, onCompleteLogin, router]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  if (!signedIn && !inAuthGroup) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
