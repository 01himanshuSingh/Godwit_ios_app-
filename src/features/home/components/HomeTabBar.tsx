import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

type TabItem = {
  key: string;
  label: string;
  /** Feather icon — omitted for trips (uses tilted airplane). */
  icon?: FeatherIconName;
};

/** Phase 1 tabs — visual only until Expo Router tab shell is wired. */
const PHASE1_TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'trips', label: 'Trips' },
  { key: 'messages', label: 'Messages', icon: 'message-square' },
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'testing', label: 'Testing', icon: 'tool' },
];

type HomeTabBarProps = {
  activeTab?: string;
  onTabPress?: (tabKey: string) => void;
};

function TabIcon({ tabKey, icon, tint }: { tabKey: string; icon?: FeatherIconName; tint: string }) {
  // Same airplane + upper-right tilt as Flight / Private jet on New request.
  if (tabKey === 'trips') {
    return (
      <View style={styles.tripsIconTilt}>
        <Ionicons name="airplane-outline" size={20} color={tint} />
      </View>
    );
  }

  return <Feather name={icon ?? 'circle'} size={20} color={tint} />;
}

export function HomeTabBar({ activeTab = 'home', onTabPress }: HomeTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {PHASE1_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const tint = isActive ? colors.forest : colors.muted;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              onPress={() => onTabPress?.(tab.key)}
              style={styles.tabPressable}
            >
              <View style={styles.tab}>
                <TabIcon tabKey={tab.key} icon={tab.icon} tint={tint} />
                <Text style={[styles.tabLabel, { color: tint }]}>{tab.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 4,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tripsIconTilt: {
    transform: [{ rotate: '-45deg' }],
  },
  tabLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
  },
});
