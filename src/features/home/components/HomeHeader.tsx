import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { HomeViewModel } from '@/features/home/schemas/homeViewModel';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type HomeHeaderProps = Pick<HomeViewModel, 'notificationsCount' | 'profileInitials'>;

export function HomeHeader({ notificationsCount, profileInitials }: HomeHeaderProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const badgeLabel = notificationsCount > 99 ? '99+' : String(notificationsCount);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text
        style={[styles.wordmark, compact && styles.wordmarkCompact]}
        accessibilityRole="header"
        numberOfLines={1}
      >
        GODWIT
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Feather name="bell" size={22} color={colors.forest} />
          {notificationsCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        >
          <Text style={styles.avatarText}>{profileInitials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wordmark: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 26,
    letterSpacing: 6,
    color: colors.forest,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  wordmarkCompact: {
    fontSize: 22,
    letterSpacing: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    color: colors.primaryForeground,
    lineHeight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.primaryForeground,
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
});
