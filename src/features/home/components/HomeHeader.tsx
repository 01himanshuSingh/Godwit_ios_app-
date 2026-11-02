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
      <View style={styles.wordmarkWrap}>
        <Text
          style={[styles.wordmark, compact && styles.wordmarkCompact]}
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          allowFontScaling={false}
        >
          GODWIT
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          style={styles.pressable}
        >
          <View style={styles.iconButton}>
            <Feather name="bell" size={22} color={colors.forest} />
            {notificationsCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
          style={styles.pressable}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profileInitials}</Text>
          </View>
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
    borderBottomColor: colors.headerBorder,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wordmarkWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: 2.5,
    color: colors.forest,
    textTransform: 'uppercase',
    // Extra pad so RN letterSpacing does not clip the last letter.
    paddingRight: 4,
  },
  wordmarkCompact: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 14,
  },
  pressable: {
    // Touch wrapper only — visuals live on child Views.
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
});
