import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { WizardTabConfig, WizardTabId } from '@/features/requests/wizard/types';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type WizardTabBarProps = {
  tabs: WizardTabConfig[];
  activeId: WizardTabId;
  completed: Partial<Record<WizardTabId, boolean>>;
  disabled?: Partial<Record<WizardTabId, boolean>>;
  onChange: (id: WizardTabId) => void;
};

export function WizardTabBar({ tabs, activeId, completed, disabled, onChange }: WizardTabBarProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          const isDone = Boolean(completed[tab.id]);
          const isDisabled = Boolean(disabled?.[tab.id]);
          /** Tick only after Continue left this step — active step keeps its number. */
          const showCheck = isDone && !isActive;
          const n = index + 1;

          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onChange(tab.id)}
              style={[styles.tab, isDisabled && styles.tabDisabled]}
            >
              <View style={styles.tabInner}>
                <View
                  style={[
                    styles.circle,
                    showCheck && styles.circleDone,
                    isActive && !showCheck && styles.circleActive,
                  ]}
                >
                  {showCheck ? (
                    <Feather name="check" size={12} color={colors.forest} />
                  ) : (
                    <Text style={[styles.circleText, isActive && styles.circleTextActive]}>
                      {n}
                    </Text>
                  )}
                </View>
                <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
              </View>
              {isActive ? (
                <View style={styles.underline} />
              ) : (
                <View style={styles.underlineSpacer} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  row: {
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 10,
    minWidth: 76,
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    minHeight: 44,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.forest,
  },
  circleDone: {
    backgroundColor: colors.sand,
  },
  circleText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    color: colors.muted,
  },
  circleTextActive: {
    color: colors.sand,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.muted,
  },
  labelActive: {
    fontFamily: fontFamily.manrope.semibold,
    color: colors.forest,
  },
  underline: {
    height: 2,
    backgroundColor: colors.forest,
    borderRadius: 1,
  },
  underlineSpacer: {
    height: 2,
  },
});
