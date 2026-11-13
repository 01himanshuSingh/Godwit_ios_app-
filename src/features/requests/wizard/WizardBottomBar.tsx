import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_TAB_BAR_CLEARANCE } from '@/features/requests/wizard/tabBarClearance';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type WizardBottomBarProps = {
  summaryPrimary: string;
  summarySecondary?: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  loading?: boolean;
  /** Lift above floating HomeTabBar */
  clearTabBar?: boolean;
  onPressSummary: () => void;
  onPressCta: () => void;
};

export function WizardBottomBar({
  summaryPrimary,
  summarySecondary,
  ctaLabel,
  ctaDisabled,
  loading,
  clearTabBar,
  onPressSummary,
  onPressCta,
}: WizardBottomBarProps) {
  const insets = useSafeAreaInsets();
  /**
   * Full-screen New request: pad for home indicator only.
   * clearTabBar reserved if a floating tab bar is ever shown again.
   */
  const bottomPad = Math.max(insets.bottom, 12);
  const tabLift = clearTabBar ? HOME_TAB_BAR_CLEARANCE : 0;

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad, marginBottom: tabLift }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open request summary"
        onPress={onPressSummary}
        style={styles.summary}
      >
        <View style={styles.summaryText}>
          <Text style={styles.summaryPrimary} numberOfLines={1}>
            {summaryPrimary || 'Add stay details'}
          </Text>
          {summarySecondary ? (
            <Text style={styles.summarySecondary} numberOfLines={1}>
              {summarySecondary}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-up" size={16} color={colors.muted} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        disabled={ctaDisabled || loading}
        onPress={onPressCta}
        style={[styles.cta, (ctaDisabled || loading) && styles.ctaDisabled]}
      >
        <Text style={styles.ctaLabel}>{loading ? 'Sending…' : ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    minHeight: 80,
    /** Page sand — not white card surface */
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryPrimary: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    color: colors.forest,
  },
  summarySecondary: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
  cta: {
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    color: colors.sand,
  },
});
