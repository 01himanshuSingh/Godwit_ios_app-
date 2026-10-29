/**
 * Expandable Hotels prefs card — brands + room type rows with Edit.
 * Matches traveller detail mock (toggle open / close).
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';

import type { TravellerHotelPrefs } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HotelsCardProps = {
  hotelPrefs: TravellerHotelPrefs;
  initiallyExpanded?: boolean;
  onEditBrands?: () => void;
  onEditRoomType?: () => void;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 16,
      radius: 18,
      sectionLabelSize: 11,
      summarySize: 14,
      summaryLineHeight: 20,
      fieldLabelSize: 11,
      fieldValueSize: 15,
      fieldValueLineHeight: 20,
      editSize: 13,
      chevronSize: 18,
      fieldGap: 6,
    };
  }
  return {
    padH: 22,
    padV: 18,
    radius: 20,
    sectionLabelSize: 11,
    summarySize: 15,
    summaryLineHeight: 22,
    fieldLabelSize: 11,
    fieldValueSize: 16,
    fieldValueLineHeight: 22,
    editSize: 14,
    chevronSize: 20,
    fieldGap: 6,
  };
}

function PrefRow({
  label,
  value,
  layout,
  onEdit,
}: {
  label: string;
  value: string | null;
  layout: ReturnType<typeof layoutForWidth>;
  onEdit?: () => void;
}) {
  return (
    <View style={[styles.prefRow, { gap: layout.fieldGap }]}>
      <View style={styles.prefHeader}>
        <Text style={[styles.fieldLabel, { fontSize: layout.fieldLabelSize, letterSpacing: 0.7 }]}>
          {label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={[styles.editLabel, { fontSize: layout.editSize }]}>Edit</Text>
        </Pressable>
      </View>
      <Text
        style={[
          styles.fieldValue,
          {
            fontSize: layout.fieldValueSize,
            lineHeight: layout.fieldValueLineHeight,
            color: value ? colors.forest : colors.muted,
          },
        ]}
        selectable={Boolean(value)}
      >
        {value || 'Not set'}
      </Text>
    </View>
  );
}

export function HotelsCard({
  hotelPrefs,
  initiallyExpanded = true,
  onEditBrands,
  onEditRoomType,
}: HotelsCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const summary =
    hotelPrefs.summaryLine ||
    hotelPrefs.preferredRoomType ||
    hotelPrefs.specialRequests ||
    'Hotel preferences';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Hotels"
        onPress={toggle}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
      >
        <View style={styles.headerText}>
          <Text
            style={[styles.sectionLabel, { fontSize: layout.sectionLabelSize, letterSpacing: 0.8 }]}
          >
            HOTELS
          </Text>
          <Text
            style={[
              styles.summary,
              {
                fontSize: layout.summarySize,
                lineHeight: layout.summaryLineHeight,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {summary}
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={layout.chevronSize}
          color="#C4C0B8"
        />
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.divider} />
          <View style={styles.fields}>
            <PrefRow
              label="PREFERRED HOTEL BRANDS"
              value={hotelPrefs.preferredHotelBrands}
              layout={layout}
              onEdit={onEditBrands}
            />
            <View style={styles.rowDivider} />
            <PrefRow
              label="PREFERRED ROOM TYPE"
              value={hotelPrefs.preferredRoomType}
              layout={layout}
              onEdit={onEditRoomType}
            />
          </View>
        </>
      ) : null}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summary: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 16,
    marginBottom: 4,
  },
  fields: {
    width: '100%',
  },
  prefRow: {
    paddingVertical: 14,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
    flex: 1,
  },
  editLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  fieldValue: {
    fontFamily: fontFamily.manrope.regular,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
});
