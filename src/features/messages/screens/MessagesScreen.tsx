/**
 * Messages tab — messaging module not wired yet.
 * Premium coming-soon UI only (same pattern as Profile → Notifications).
 */
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useHomeTabBarScrollProps } from '@/features/home/tabBar/HomeTabBarVisibility';
import { MessagesEmptyCard } from '@/features/messages/components/MessagesEmptyCard';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 24;

export function MessagesScreen() {
  const { width } = useWindowDimensions();
  const tabBarScroll = useHomeTabBarScrollProps();
  const pagePad = width < 360 ? 16 : width >= 768 ? 32 : 24;
  const headerTop = width < 360 ? 16 : width >= 768 ? 28 : 22;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: pagePad,
          paddingTop: headerTop,
          paddingBottom: TAB_BAR_CLEARANCE,
        },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={tabBarScroll.onScroll}
      scrollEventThrottle={tabBarScroll.scrollEventThrottle}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Messages
        </Text>
        <Text style={styles.subtitle}>Your Godwit travel team, one conversation away.</Text>
      </View>

      <MessagesEmptyCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    gap: 20,
  },
  header: {
    gap: 6,
    paddingBottom: 4,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 28,
    lineHeight: 34,
    color: colors.forest,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
