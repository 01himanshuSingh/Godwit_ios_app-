import Feather from '@expo/vector-icons/Feather';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { HomeViewModel } from '@/features/home/schemas/homeViewModel';
import { GODWIT_HEADER_LOGO_LIGHT } from '@/ui/brand/godwitBrandAssets';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

/** Content row height under the status-bar safe area. */
export const APP_HEADER_HEIGHT = 58;

/** Intrinsic lockup ratio from GodwitHeader-Logo-Light.png (~3.64:1). */
const LOGO_ASPECT = 1059 / 291;

type HomeHeaderProps = Pick<HomeViewModel, 'notificationsCount' | 'profileInitials'>;

function logoSizeForWidth(width: number): { height: number; width: number } {
  const height = width < 360 ? 28 : width < 400 ? 31 : 33;
  return { height, width: Math.round(height * LOGO_ASPECT) };
}

export function HomeHeader({ notificationsCount, profileInitials }: HomeHeaderProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const logo = logoSizeForWidth(width);
  const badgeLabel = notificationsCount > 99 ? '99+' : String(notificationsCount);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.brandWrap}>
        <Image
          source={GODWIT_HEADER_LOGO_LIGHT}
          style={{ width: logo.width, height: logo.height }}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Godwit"
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          style={styles.pressable}
        >
          <View style={styles.iconButton}>
            <Feather name="bell" size={21} color={colors.forest} />
            {notificationsCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} allowFontScaling={false}>
                  {badgeLabel}
                </Text>
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
            <Text style={styles.avatarText} allowFontScaling={false}>
              {profileInitials}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: APP_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.headerBorder,
  },
  containerCompact: {
    paddingHorizontal: 16,
  },
  brandWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    fontSize: 10,
    lineHeight: 12,
    color: colors.primaryForeground,
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
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: colors.primaryForeground,
    letterSpacing: 0.4,
  },
});
