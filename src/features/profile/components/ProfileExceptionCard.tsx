/**
 * Profile hub exception — first-section load/scope failure.
 * Never invents a guest identity; never surfaces adminId, clientId, or raw DB/error text.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type ProfileExceptionVariant = 'missing_scope' | 'load_error' | 'not_found';

type ProfileExceptionCardProps = {
  variant: ProfileExceptionVariant;
  isRetrying?: boolean;
  onRetry?: () => void;
};

type FeatherIconName = ComponentProps<typeof Feather>['name'];

function copyForVariant(variant: ProfileExceptionVariant): {
  title: string;
  body: string;
  icon: FeatherIconName;
  showTelemetry: boolean;
} {
  switch (variant) {
    case 'missing_scope':
      return {
        title: 'Sign in required',
        body: 'Account details are missing. Please sign in again — we won’t show another guest’s profile.',
        icon: 'alert-circle',
        showTelemetry: false,
      };
    case 'not_found':
      return {
        title: 'Unable to load client profile',
        body: 'Your profile details are currently unavailable. Secure session connection will re-establish automatically.',
        icon: 'alert-circle',
        showTelemetry: true,
      };
    case 'load_error':
    default:
      return {
        title: 'Unable to load client profile',
        body: 'Your profile details are currently unavailable. Secure session connection will re-establish automatically.',
        icon: 'alert-circle',
        showTelemetry: true,
      };
  }
}

export function ProfileExceptionCard({ variant, isRetrying, onRetry }: ProfileExceptionCardProps) {
  const copy = copyForVariant(variant);
  const showRetry = typeof onRetry === 'function';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconWell}>
          <Feather name={copy.icon} size={22} color={colors.forest} />
        </View>

        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        {copy.showTelemetry ? (
          <View style={styles.telemetryBox}>
            <View style={styles.telemetryHeader}>
              <View style={styles.telemetryDot} />
              <Text style={styles.telemetryLabel}>TELEMETRY LOG</Text>
            </View>
            {/* Sanitized only — never adminId, clientId, or raw Firestore/API payloads. */}
            <Text style={styles.telemetryValue} selectable={false}>
              status: UNAVAILABLE
            </Text>
          </View>
        ) : null}

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
                <Text style={styles.ctaLabel}>Retry</Text>
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
    width: '100%',
  },
  card: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    gap: 12,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    marginBottom: 2,
  },
  title: {
    alignSelf: 'stretch',
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 22,
    lineHeight: 28,
    color: colors.forest,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 300,
  },
  telemetryBox: {
    alignSelf: 'stretch',
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  telemetryLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.muted,
  },
  telemetryValue: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
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
    paddingHorizontal: 22,
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
