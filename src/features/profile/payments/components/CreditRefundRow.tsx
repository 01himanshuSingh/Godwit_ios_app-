/**
 * One credits/refunds row — title, subtitle, – USD amount, status pill.
 * receiptUrl kept on model; View proof hidden for now.
 */
import { memo, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { CreditRefundItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CreditRefundRowProps = {
  item: CreditRefundItem;
  showDivider: boolean;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 16,
      padV: 14,
      titleSize: 16,
      titleLineHeight: 22,
      metaSize: 12,
      metaLineHeight: 16,
      amountSize: 16,
      amountLineHeight: 20,
      badgeSize: 11,
      colGap: 10,
      amountColMax: 118,
    };
  }
  return {
    padH: 22,
    padV: 18,
    titleSize: 18,
    titleLineHeight: 24,
    metaSize: 13,
    metaLineHeight: 18,
    amountSize: 17,
    amountLineHeight: 22,
    badgeSize: 12,
    colGap: 14,
    amountColMax: 136,
  };
}

function CreditRefundRowComponent({ item, showDivider }: CreditRefundRowProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  return (
    <View>
      {showDivider ? <View style={[styles.divider, { marginHorizontal: layout.padH }]} /> : null}
      <View
        style={[
          styles.row,
          {
            paddingHorizontal: layout.padH,
            paddingVertical: layout.padV,
            gap: layout.colGap,
          },
        ]}
      >
        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              { fontSize: layout.titleSize, lineHeight: layout.titleLineHeight },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { fontSize: layout.metaSize, lineHeight: layout.metaLineHeight },
              ]}
            >
              {item.subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.amountCol, { maxWidth: layout.amountColMax }]}>
          <Text
            style={[
              styles.amount,
              { fontSize: layout.amountSize, lineHeight: layout.amountLineHeight },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {item.amountLabel}
          </Text>
          <View style={styles.badge}>
            <Text style={[styles.badgeLabel, { fontSize: layout.badgeSize }]}>
              {item.statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export const CreditRefundRow = memo(CreditRefundRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  // Mock: title + amount = Cormorant; meta + badge = Manrope
  title: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  amount: {
    fontFamily: fontFamily.cormorant.medium,
    color: colors.forest,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8E6E1',
  },
  badgeLabel: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
