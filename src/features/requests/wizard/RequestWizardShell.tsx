/**
 * Shared New request wizard chrome: top bar, title, sticky tabs, scroll body, footer.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeTabBarScrollProps } from '@/features/home/tabBar/HomeTabBarVisibility';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import { WizardBottomBar } from '@/features/requests/wizard/WizardBottomBar';
import { WizardTabBar } from '@/features/requests/wizard/WizardTabBar';
import type { WizardTabConfig, WizardTabId } from '@/features/requests/wizard/types';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type RequestWizardShellProps = {
  title: string;
  /** @deprecated Unused — kept optional so existing callers compile. */
  subtitle?: string;
  onBack: () => void;
  /** @deprecated Unused — draft pill removed from UI. */
  draftSaved?: boolean;
  tabs: WizardTabConfig[];
  activeTab: WizardTabId;
  completed: Partial<Record<WizardTabId, boolean>>;
  disabledTabs?: Partial<Record<WizardTabId, boolean>>;
  onChangeTab: (id: WizardTabId) => void;
  summaryPrimary: string;
  summarySecondary?: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onPressSummary: () => void;
  onPressCta: () => void;
  /** Extra bottom inset when floating HomeTabBar is visible */
  clearTabBar?: boolean;
  children: ReactNode;
};

export function RequestWizardShell({
  title,
  onBack,
  tabs,
  activeTab,
  completed,
  disabledTabs,
  onChangeTab,
  summaryPrimary,
  summarySecondary,
  ctaLabel,
  ctaDisabled,
  ctaLoading,
  onPressSummary,
  onPressCta,
  clearTabBar,
  children,
}: RequestWizardShellProps) {
  const insets = useSafeAreaInsets();
  const tabBarScroll = useHomeTabBarScrollProps();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Requests"
          onPress={onBack}
          hitSlop={8}
          style={styles.backRow}
        >
          <Feather name="chevron-left" size={20} color={colors.muted} />
          <Text style={styles.backLabel}>Requests</Text>
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>

      <WizardTabBar
        tabs={tabs}
        activeId={activeTab}
        completed={completed}
        disabled={disabledTabs}
        onChange={onChangeTab}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 20 + (clearTabBar ? 8 : Math.max(insets.bottom, 8)),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={tabBarScroll.onScroll}
        scrollEventThrottle={tabBarScroll.scrollEventThrottle}
      >
        <View
          style={[
            styles.card,
            {
              borderRadius: layout.cardRadius,
              paddingHorizontal: layout.cardPadH,
              paddingVertical: layout.cardPadV,
              shadowOpacity: layout.shadowOpacity,
              shadowRadius: layout.shadowRadius,
            },
          ]}
        >
          {children}
        </View>
      </ScrollView>

      <WizardBottomBar
        summaryPrimary={summaryPrimary}
        summarySecondary={summarySecondary}
        ctaLabel={ctaLabel}
        ctaDisabled={ctaDisabled}
        loading={ctaLoading}
        clearTabBar={clearTabBar}
        onPressSummary={onPressSummary}
        onPressCta={onPressCta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 2,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    minWidth: 88,
  },
  backLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.muted,
  },
  titleBlock: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 32,
    lineHeight: 40,
    color: colors.forest,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
