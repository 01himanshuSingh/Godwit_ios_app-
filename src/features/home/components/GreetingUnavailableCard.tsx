/**
 * Home greeting exception — shown when session client name is missing.
 * Never invents a static person/family identity.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import { greetingForLocalTime } from '@/lib/session/activeClientProfile';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type GreetingUnavailableCardProps = {
  isRetrying?: boolean;
  onRetry?: () => void;
};

export function GreetingUnavailableCard({ isRetrying, onRetry }: GreetingUnavailableCardProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);
  const greeting = greetingForLocalTime();

  return (
    <View style={[styles.wrap, { paddingHorizontal: inset }]}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>{greeting}</Text>
        <Text style={styles.body}>
          We couldn’t load your profile details. Home won’t show another guest’s name — retry or
          sign in again.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading profile"
          disabled={isRetrying}
          onPress={onRetry}
          style={styles.pressable}
        >
          <View style={styles.cta}>
            {isRetrying ? (
              <ActivityIndicator size="small" color={colors.forest} />
            ) : (
              <>
                <Text style={styles.ctaLabel}>Retry</Text>
                <Feather name="refresh-cw" size={13} color={colors.forest} />
              </>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 22,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 10 * 0.16,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 26,
    lineHeight: 32,
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 16,
  },
  pressable: {
    alignSelf: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ctaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    color: colors.forest,
  },
});
