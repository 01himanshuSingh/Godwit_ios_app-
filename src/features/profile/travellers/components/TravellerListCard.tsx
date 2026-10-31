/**
 * Travellers list card — name (medium) + detail line + chevron.
 * Visual styles on View; Pressable is a plain touch wrapper (NativeWind-safe).
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ClientTraveller } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerListCardProps = {
  travellers: ClientTraveller[];
  onPressTraveller?: (traveller: ClientTraveller) => void;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 12,
      rowPadV: 14,
      textGap: 6,
      nameSize: 15,
      nameLineHeight: 20,
      detailSize: 12,
      detailLineHeight: 16,
      chevronSize: 16,
      chevronGap: 12,
      radius: 20,
    };
  }
  if (width < 768) {
    return {
      padH: 22,
      padV: 14,
      rowPadV: 16,
      textGap: 6,
      nameSize: 16,
      nameLineHeight: 22,
      detailSize: 13,
      detailLineHeight: 18,
      chevronSize: 18,
      chevronGap: 14,
      radius: 20,
    };
  }
  return {
    padH: 26,
    padV: 16,
    rowPadV: 18,
    textGap: 8,
    nameSize: 17,
    nameLineHeight: 24,
    detailSize: 14,
    detailLineHeight: 20,
    chevronSize: 18,
    chevronGap: 16,
    radius: 20,
  };
}

export function TravellerListCard({ travellers, onPressTraveller }: TravellerListCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  if (travellers.length === 0) {
    return (
      <View
        style={[
          styles.card,
          {
            borderRadius: layout.radius,
            paddingHorizontal: layout.padH,
            paddingVertical: layout.padV + 8,
          },
        ]}
      >
        <Text style={styles.empty}>No travellers linked to this client yet.</Text>
      </View>
    );
  }

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
      {travellers.map((traveller, index) => (
        <View key={traveller.customerId}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={traveller.name}
            onPress={() => onPressTraveller?.(traveller)}
            style={styles.rowPressable}
          >
            <View
              style={[
                styles.row,
                {
                  paddingVertical: layout.rowPadV,
                  gap: layout.textGap,
                },
              ]}
            >
              <View style={[styles.nameRow, { gap: layout.chevronGap }]}>
                <Text
                  style={[
                    styles.name,
                    {
                      fontSize: layout.nameSize,
                      lineHeight: layout.nameLineHeight,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {traveller.name || '—'}
                </Text>
                <Feather name="chevron-right" size={layout.chevronSize} color="#C4C0B8" />
              </View>
              {traveller.detailLine ? (
                <Text
                  style={[
                    styles.detail,
                    {
                      fontSize: layout.detailSize,
                      lineHeight: layout.detailLineHeight,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {traveller.detailLine}
                </Text>
              ) : null}
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
  rowPressable: {
    width: '100%',
  },
  row: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  detail: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
});
