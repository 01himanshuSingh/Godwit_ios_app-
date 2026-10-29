/**
 * Expandable Loyalty card — programme rows + masked numbers + optional tier.
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

import type { TravellerLoyalty, TravellerLoyaltyRow } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LoyaltyCardProps = {
  loyalty: TravellerLoyalty;
  initiallyExpanded?: boolean;
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
      programSize: 15,
      programLineHeight: 20,
      memberSize: 13,
      memberLineHeight: 18,
      numberSize: 13,
      numberLineHeight: 18,
      tierSize: 12,
      chevronSize: 18,
      rowGap: 4,
      footerSize: 12,
    };
  }
  return {
    padH: 22,
    padV: 18,
    radius: 20,
    sectionLabelSize: 11,
    summarySize: 15,
    summaryLineHeight: 22,
    programSize: 16,
    programLineHeight: 22,
    memberSize: 14,
    memberLineHeight: 20,
    numberSize: 14,
    numberLineHeight: 20,
    tierSize: 12,
    chevronSize: 20,
    rowGap: 5,
    footerSize: 13,
  };
}

function LoyaltyRowItem({
  row,
  layout,
  showDivider,
}: {
  row: TravellerLoyaltyRow;
  layout: ReturnType<typeof layoutForWidth>;
  showDivider: boolean;
}) {
  return (
    <View>
      {showDivider ? <View style={styles.rowDivider} /> : null}
      <View style={styles.row}>
        <View style={[styles.rowText, { gap: layout.rowGap }]}>
          <View style={styles.programLine}>
            <Text
              style={[
                styles.programName,
                {
                  fontSize: layout.programSize,
                  lineHeight: layout.programLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {row.programName}
            </Text>
            {row.tier ? (
              <View style={styles.tierBadge}>
                <Text style={[styles.tierLabel, { fontSize: layout.tierSize }]} numberOfLines={1}>
                  {row.tier}
                </Text>
              </View>
            ) : null}
          </View>
          {row.memberName ? (
            <Text
              style={[
                styles.memberName,
                {
                  fontSize: layout.memberSize,
                  lineHeight: layout.memberLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {row.memberName}
            </Text>
          ) : null}
          {row.memberNumberMasked ? (
            <Text
              style={[
                styles.memberNumber,
                {
                  fontSize: layout.numberSize,
                  lineHeight: layout.numberLineHeight,
                },
              ]}
              numberOfLines={1}
            >
              {row.memberNumberMasked}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function LoyaltyCard({ loyalty, initiallyExpanded = true }: LoyaltyCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const summary =
    loyalty.summaryLine || (loyalty.rows.length === 0 ? 'No programmes yet' : 'Loyalty programmes');

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
        accessibilityLabel="Loyalty"
        onPress={toggle}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
      >
        <View style={styles.headerText}>
          <Text
            style={[styles.sectionLabel, { fontSize: layout.sectionLabelSize, letterSpacing: 0.8 }]}
          >
            LOYALTY
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
          {loyalty.rows.length === 0 ? (
            <Text style={styles.empty}>No loyalty programmes linked yet.</Text>
          ) : (
            loyalty.rows.map((row, index) => (
              <LoyaltyRowItem key={row.id} row={row} layout={layout} showDivider={index > 0} />
            ))
          )}
          <Text
            style={[
              styles.footer,
              {
                fontSize: layout.footerSize,
                marginTop: loyalty.rows.length === 0 ? 12 : 16,
              },
            ]}
          >
            Membership numbers are added and verified by your Godwit team.
          </Text>
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
  row: {
    paddingVertical: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  programLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  programName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  tierBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8E6E1',
  },
  tierLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  memberName: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  memberNumber: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  footer: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
