/**
 * WHO IS TRAVELLING — selectable name chips in a rounded card.
 * Accepts travellers from props so an API can replace the mock later.
 */
import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { RequestTraveller } from '@/features/requests/data/mockRequestTravellers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellersSelectionCardProps = {
  travellers: readonly RequestTraveller[];
  selectedIds: readonly string[];
  onToggleTraveller: (travellerId: string) => void;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      cardPad: 16,
      cardRadius: 16,
      labelSize: 11,
      labelLetter: 1.4,
      chipPadH: 14,
      chipPadV: 10,
      chipGap: 10,
      chipTextSize: 13,
      labelToChips: 14,
    };
  }
  return {
    cardPad: 20,
    cardRadius: 18,
    labelSize: 11,
    labelLetter: 1.6,
    chipPadH: 16,
    chipPadV: 11,
    chipGap: 12,
    chipTextSize: 14,
    labelToChips: 16,
  };
}

function TravellerChip({
  name,
  selected,
  onPress,
  padH,
  padV,
  textSize,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
  padH: number;
  padV: number;
  textSize: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      onPress={onPress}
      style={styles.chipPressable}
    >
      <View
        style={[
          styles.chip,
          selected && styles.chipSelected,
          {
            paddingHorizontal: padH,
            paddingVertical: padV,
          },
        ]}
      >
        <Text
          style={[styles.chipLabel, selected && styles.chipLabelSelected, { fontSize: textSize }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

function TravellersSelectionCardComponent({
  travellers,
  selectedIds,
  onToggleTraveller,
}: TravellersSelectionCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleToggle = useCallback(
    (id: string) => {
      onToggleTraveller(id);
    },
    [onToggleTraveller],
  );

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.cardRadius,
          paddingHorizontal: layout.cardPad,
          paddingTop: layout.cardPad,
          paddingBottom: layout.cardPad,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize: layout.labelSize,
            letterSpacing: layout.labelLetter,
            marginBottom: layout.labelToChips,
          },
        ]}
      >
        WHO IS TRAVELLING
      </Text>

      <View style={[styles.chipsWrap, { gap: layout.chipGap }]}>
        {travellers.map((traveller) => (
          <TravellerChip
            key={traveller.id}
            name={traveller.name}
            selected={selectedSet.has(traveller.id)}
            onPress={() => {
              handleToggle(traveller.id);
            }}
            padH={layout.chipPadH}
            padV={layout.chipPadV}
            textSize={layout.chipTextSize}
          />
        ))}
      </View>
    </View>
  );
}

export const TravellersSelectionCard = memo(TravellersSelectionCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  chipPressable: {
    // Touch wrapper only — visual styles live on the View below.
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    maxWidth: '100%',
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  chipLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  chipLabelSelected: {
    color: colors.sand,
  },
});
