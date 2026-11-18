/**
 * Traveller detail load exception — NOTICE card + friendly mapped copy + Retry.
 * Never surfaces adminId, customerId, or raw Firestore/API payloads.
 */
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TravellerDetailLoadErrorKind } from '@/lib/firebase/customers/mapTravellerDetailLoadError';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerDetailExceptionCardProps = {
  kind: TravellerDetailLoadErrorKind;
  /** Mapped client-facing headline only (never raw). */
  message: string;
  isRetrying?: boolean;
  onRetry?: () => void;
};

function headlineForKind(kind: TravellerDetailLoadErrorKind, message: string): string {
  const mapped = message.trim();
  if (mapped) return mapped;
  switch (kind) {
    case 'missing_scope':
    case 'auth':
      return 'Account details are missing. Please sign in again.';
    case 'permission':
      return 'You don’t have access to this traveller.';
    case 'offline':
      return 'Connection issue. Check your network and try again.';
    case 'not_found':
      return 'This traveller couldn’t be found.';
    default:
      return 'Couldn’t load this traveller. Please try again.';
  }
}

function bodyForKind(kind: TravellerDetailLoadErrorKind): string {
  switch (kind) {
    case 'missing_scope':
    case 'auth':
      return 'We won’t show another guest’s details. Sign in to continue.';
    case 'not_found':
      return 'They may have been removed from your roster, or the link is no longer valid.';
    case 'permission':
      return 'Your private roster remains encrypted and safeguarded.';
    default:
      return 'Your private roster remains encrypted and safeguarded.';
  }
}

export function TravellerDetailExceptionCard({
  kind,
  message,
  isRetrying,
  onRetry,
}: TravellerDetailExceptionCardProps) {
  const title = headlineForKind(kind, message);
  const body = bodyForKind(kind);
  const showRetry =
    typeof onRetry === 'function' &&
    kind !== 'missing_scope' &&
    kind !== 'auth' &&
    kind !== 'not_found';

  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.noticeRow}>
        <View style={styles.noticeIcon}>
          <Feather name="info" size={12} color={colors.muted} />
        </View>
        <Text style={styles.noticeLabel}>NOTICE</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

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
              <View style={styles.ctaBusy}>
                <ActivityIndicator size="small" color={colors.primaryForeground} />
                <Text style={styles.ctaLabel}>Retrying…</Text>
              </View>
            ) : (
              <View style={styles.ctaBusy}>
                <Feather name="refresh-cw" size={14} color={colors.primaryForeground} />
                <Text style={styles.ctaLabel}>Retry</Text>
              </View>
            )}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 10,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  noticeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  noticeLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  title: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.forest,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginBottom: 4,
  },
  pressable: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.forest,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  ctaDisabled: {
    opacity: 0.75,
  },
  ctaBusy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    color: colors.primaryForeground,
  },
});
