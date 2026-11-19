import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHomeTabBarVisibility } from '@/features/home/tabBar/HomeTabBarVisibility';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

type TabItem = {
  key: string;
  label: string;
  /** Feather icon — omitted for trips (uses tilted airplane). */
  icon?: FeatherIconName;
};

const TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'trips', label: 'Trips' },
  { key: 'messages', label: 'Messages', icon: 'message-square' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

/** Content row height above the home-indicator safe area. */
export const HOME_TAB_BAR_CONTENT_HEIGHT = 52;

type HomeTabBarProps = {
  activeTab?: string;
  onTabPress?: (tabKey: string) => void;
};

function TabIcon({
  tabKey,
  icon,
  tint,
  active,
}: {
  tabKey: string;
  icon?: FeatherIconName;
  tint: string;
  active: boolean;
}) {
  if (tabKey === 'trips') {
    return (
      <View style={styles.tripsIconTilt}>
        <Ionicons name={active ? 'airplane' : 'airplane-outline'} size={22} color={tint} />
      </View>
    );
  }

  return <Feather name={icon ?? 'circle'} size={22} color={tint} />;
}

export function HomeTabBar({ activeTab = 'home', onTabPress }: HomeTabBarProps) {
  const insets = useSafeAreaInsets();
  const { suppressed } = useHomeTabBarVisibility();
  const bottomPad = Math.max(insets.bottom, 8);

  if (suppressed) {
    return null;
  }

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]} accessibilityRole="tablist">
      <View style={styles.hairline} />
      <View style={styles.row}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const tint = isActive ? colors.forest : colors.muted;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              onPress={() => onTabPress?.(tab.key)}
              style={({ pressed }) => [styles.tabPressable, pressed && styles.tabPressed]}
            >
              <View style={styles.tab}>
                {isActive ? <View style={styles.activeTick} /> : null}
                <TabIcon tabKey={tab.key} icon={tab.icon} tint={tint} active={isActive} />
                <Text
                  style={[styles.tabLabel, { color: tint }, isActive && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.headerBorder,
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.headerBorder,
  },
  row: {
    height: HOME_TAB_BAR_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tabPressable: {
    flex: 1,
    minWidth: 0,
  },
  tabPressed: {
    opacity: 0.72,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
    paddingBottom: 4,
  },
  activeTick: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.forest,
  },
  tripsIconTilt: {
    transform: [{ rotate: '-45deg' }],
  },
  tabLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: fontFamily.manrope.semibold,
  },
});
