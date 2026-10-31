/**
 * One category card in the 2×4 New request grid.
 *
 * NOTE: Card layout, background, border, and shadow live on a <View>, not on
 * <Pressable style={({ pressed }) => ...}>, because NativeWind v4's cssInterop
 * drops function style props on Pressable on device builds.
 */
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { RequestService } from '@/features/requests/data/requestServices';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type RequestServiceCardProps = {
  service: RequestService;
  cardWidth: number;
  onPress?: (service: RequestService) => void;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      height: 112,
      padH: 15,
      padV: 14,
      radius: 12,
      iconSize: 22,
      labelSize: 18,
      labelLineHeight: 22,
    };
  }
  return {
    height: 122,
    padH: 18,
    padV: 16,
    radius: 12,
    iconSize: 24,
    labelSize: 20,
    labelLineHeight: 24,
  };
}

function ServiceIcon({ service, size }: { service: RequestService; size: number }) {
  const tint = colors.forest;
  if (service.iconSet === 'feather') {
    return <Feather name={service.icon as 'home'} size={size} color={tint} />;
  }
  return <Ionicons name={service.icon as 'airplane-outline'} size={size} color={tint} />;
}

function RequestServiceCardComponent({ service, cardWidth, onPress }: RequestServiceCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  return (
    <View
      style={[
        styles.cardShell,
        {
          width: cardWidth,
          height: layout.height,
          borderRadius: layout.radius,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Request ${service.label}`}
        onPress={() => onPress?.(service)}
        style={styles.pressable}
      >
        <View
          style={[
            styles.cardInner,
            {
              height: layout.height,
              borderRadius: layout.radius,
              paddingHorizontal: layout.padH,
              paddingVertical: layout.padV,
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <ServiceIcon service={service} size={layout.iconSize} />
          </View>
          <Text
            style={[
              styles.label,
              {
                fontSize: layout.labelSize,
                lineHeight: layout.labelLineHeight,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {service.label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export const RequestServiceCard = memo(RequestServiceCardComponent);
/** Alias matching the category-card naming used in the design brief. */
export const RequestCategoryCard = RequestServiceCard;

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E2DDD3',
    shadowColor: '#1B2915',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  cardInner: {
    width: '100%',
    backgroundColor: '#FAF9F5',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    alignSelf: 'flex-start',
    height: 28,
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
});
