/**
 * Trips list / detail exception surface — Godwit card matching TripsEmptyCard.
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type TripsExceptionVariant = 'load_error' | 'missing_scope' | 'missing_sale' | 'not_found';

type TripsExceptionCardProps = {
  variant: TripsExceptionVariant;
  /** Overrides default Cormorant title (e.g. detail vs list wording). */
  title?: string | null;
  /** Overrides default body when a mapped load-error message is available. */
  message?: string | null;
  isRetrying?: boolean;
  onRetry?: () => void;
  /** Stack inside ScrollView previews without flex-fill. */
  embedded?: boolean;
};

type FeatherIconName = ComponentProps<typeof Feather>['name'];

function copyForVariant(
  variant: TripsExceptionVariant,
  message?: string | null,
): { eyebrow: string; title: string; body: string; icon: FeatherIconName } {
  switch (variant) {
    case 'missing_scope':
      return {
        eyebrow: 'YOUR ACCOUNT',
        title: 'Sign in required',
        body:
          message?.trim() || 'Account details are missing. Please sign in again to see your trips.',
        icon: 'user',
      };
    case 'missing_sale':
      return {
        eyebrow: 'BOOKING',
        title: 'Missing reference',
        body:
          message?.trim() ||
          'This booking link is incomplete. Return to itinerary and open the trip again.',
        icon: 'hash',
      };
    case 'not_found':
      return {
        eyebrow: 'BOOKING',
        title: 'Booking not found',
        body:
          message?.trim() || 'We couldn’t find this booking. It may have been moved or removed.',
        icon: 'search',
      };
    case 'load_error':
    default:
      return {
        eyebrow: 'ITINERARY',
        title: 'Couldn’t load trips',
        body:
          message?.trim() ||
          'Something went wrong while loading. Check your connection and try again.',
        icon: 'alert-circle',
      };
  }
}

export function TripsExceptionCard({
  variant,
  title: titleOverride,
  message,
  isRetrying,
  onRetry,
  embedded = false,
}: TripsExceptionCardProps) {
  const { width } = useWindowDimensions();
  const pagePad = width < 360 ? 16 : width >= 768 ? 32 : 20;
  const copy = copyForVariant(variant, message);
  const title = titleOverride?.trim() || copy.title;
  const showRetry = typeof onRetry === 'function';

  return (
    <View
      style={[
        styles.wrap,
        embedded && styles.wrapEmbedded,
        { paddingHorizontal: embedded ? 0 : pagePad },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.iconWell}>
          <Feather name={copy.icon} size={22} color={colors.forest} />
        </View>

        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
          {title}
        </Text>
        <Text style={styles.body}>{copy.body}</Text>

        {showRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRetrying ? 'Retrying' : 'Retry'}
            disabled={isRetrying}
            onPress={onRetry}
            style={styles.pressable}
          >
            <View style={[styles.cta, isRetrying && styles.ctaDisabled]}>
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
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: 28,
    justifyContent: 'flex-start',
  },
  wrapEmbedded: {
    flex: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
    gap: 10,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 10 * 0.16,
    textTransform: 'uppercase',
    color: colors.muted,
    textAlign: 'center',
  },
  title: {
    alignSelf: 'stretch',
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 22,
    lineHeight: 26,
    color: colors.forest,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 300,
  },
  pressable: {
    marginTop: 10,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    minWidth: 108,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    color: colors.forest,
  },
});
