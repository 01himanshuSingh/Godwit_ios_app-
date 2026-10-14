import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const MESSAGE_ICON = '#8A8F87';

type MessageGodwitCardProps = {
  /** Static CTA — wire to messaging later. */
  onPress?: () => void;
};

type MessageLayout = {
  padH: number;
  padV: number;
  gap: number;
  radius: number;
  marginTop: number;
  eyebrowSize: number;
  eyebrowTracking: number;
  bodySize: number;
  bodyLineHeight: number;
  textGap: number;
  iconSize: number;
  iconSlot: number;
};

function layoutForWidth(width: number): MessageLayout {
  if (width < 360) {
    return {
      padH: 14,
      padV: 14,
      gap: 8,
      radius: 14,
      marginTop: 12,
      eyebrowSize: 9,
      eyebrowTracking: 0.9,
      bodySize: 12.5,
      bodyLineHeight: 16,
      textGap: 4,
      iconSize: 18,
      iconSlot: 22,
    };
  }
  if (width < 400) {
    return {
      padH: 16,
      padV: 16,
      gap: 10,
      radius: 15,
      marginTop: 13,
      eyebrowSize: 9.5,
      eyebrowTracking: 1,
      bodySize: 13.5,
      bodyLineHeight: 18,
      textGap: 5,
      iconSize: 20,
      iconSlot: 24,
    };
  }
  if (width < 768) {
    return {
      padH: 20,
      padV: 18,
      gap: 12,
      radius: 16,
      marginTop: 14,
      eyebrowSize: 10,
      eyebrowTracking: 1.2,
      bodySize: 14.5,
      bodyLineHeight: 19,
      textGap: 5,
      iconSize: 22,
      iconSlot: 26,
    };
  }
  return {
    padH: 24,
    padV: 22,
    gap: 16,
    radius: 18,
    marginTop: 16,
    eyebrowSize: 11,
    eyebrowTracking: 1.4,
    bodySize: 16,
    bodyLineHeight: 22,
    textGap: 6,
    iconSize: 24,
    iconSlot: 28,
  };
}

/**
 * Second card under Active Trip DETAILS — chat / message CTA.
 * Fully responsive: padding, type, icon, and radius scale with screen width.
 */
export function MessageGodwitCard({ onPress }: MessageGodwitCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  return (
    <View
      style={[
        styles.cardShell,
        {
          marginTop: layout.marginTop,
          borderRadius: layout.radius,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Message Godwit about this booking"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          {
            paddingHorizontal: layout.padH,
            paddingVertical: layout.padV,
            gap: layout.gap,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.textCol, { gap: layout.textGap }]}>
          <Text
            style={[
              styles.eyebrow,
              {
                fontSize: layout.eyebrowSize,
                letterSpacing: layout.eyebrowTracking,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            ANYTHING TO ADJUST?
          </Text>
          <Text
            style={[
              styles.body,
              {
                fontSize: layout.bodySize,
                lineHeight: layout.bodyLineHeight,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Message Godwit about this booking
          </Text>
        </View>
        <View
          style={[styles.iconWrap, { width: layout.iconSlot, height: layout.iconSlot }]}
          pointerEvents="none"
        >
          <Ionicons name="chatbubble-outline" size={layout.iconSize} color={MESSAGE_ICON} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
    flexShrink: 1,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.88,
    backgroundColor: colors.surface,
  },
});
