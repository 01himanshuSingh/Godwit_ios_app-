/**
 * Profile hub menu list — all sections clickable.
 *
 *   [icon] Title
 *          subtitle…                    >
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ProfileMenuIcon } from '@/features/profile/menu/profileMenuItems';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type ProfileMenuCardItem = {
  key: string;
  icon: ProfileMenuIcon;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

type ProfileMenuCardProps = {
  items: ProfileMenuCardItem[];
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 18,
      rowGap: 14,
      iconSize: 18,
      iconGap: 12,
      titleSize: 15,
      titleLineHeight: 20,
      subtitleSize: 12,
      subtitleLineHeight: 16,
      chevronSize: 16,
      radius: 20,
      textGap: 4,
    };
  }
  if (width < 768) {
    return {
      padH: 22,
      padV: 20,
      rowGap: 16,
      iconSize: 20,
      iconGap: 12,
      titleSize: 16,
      titleLineHeight: 22,
      subtitleSize: 13,
      subtitleLineHeight: 18,
      chevronSize: 18,
      radius: 20,
      textGap: 5,
    };
  }
  return {
    padH: 26,
    padV: 24,
    rowGap: 18,
    iconSize: 22,
    iconGap: 14,
    titleSize: 17,
    titleLineHeight: 24,
    subtitleSize: 14,
    subtitleLineHeight: 20,
    chevronSize: 18,
    radius: 20,
    textGap: 5,
  };
}

export function ProfileMenuCard({ items }: ProfileMenuCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const subtitleIndent = layout.iconSize + layout.iconGap;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius,
          paddingHorizontal: layout.padH,
          paddingTop: layout.padV,
          paddingBottom: layout.padV,
        },
      ]}
    >
      {items.map((item, index) => (
        <View key={item.key}>
          {index > 0 ? (
            <View
              style={[
                styles.divider,
                {
                  marginLeft: subtitleIndent,
                  marginVertical: layout.rowGap / 2,
                },
              ]}
            />
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.subtitle}`}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.block,
              { gap: layout.textGap },
              index === 0 ? null : { paddingTop: layout.rowGap / 2 },
              index === items.length - 1 ? null : { paddingBottom: layout.rowGap / 2 },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.titleLine, { gap: layout.iconGap }]}>
              <Feather name={item.icon} size={layout.iconSize} color={colors.muted} />
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: layout.titleSize,
                    lineHeight: layout.titleLineHeight,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
            </View>

            <View style={[styles.subtitleLine, { marginLeft: subtitleIndent, gap: 8 }]}>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: layout.subtitleSize,
                    lineHeight: layout.subtitleLineHeight,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.subtitle}
              </Text>
              <Feather name="chevron-right" size={layout.chevronSize} color="#C4C0B8" />
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  block: {
    width: '100%',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  subtitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  subtitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.72,
  },
});
