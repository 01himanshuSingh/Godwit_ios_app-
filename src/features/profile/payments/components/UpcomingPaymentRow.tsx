/**
 * One upcoming-payment row: date | title+subtitle | amount+status.
 * Fonts: Cormorant title/amount · Manrope date/meta/badge.
 */
import { memo, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { UpcomingPaymentItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingPaymentRowProps = {
  item: UpcomingPaymentItem;
  showDivider: boolean;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 16,
      padV: 14,
      dateColW: 40,
      daySize: 16,
      monthSize: 10,
      titleSize: 15,
      titleLineHeight: 20,
      metaSize: 12,
      metaLineHeight: 16,
      amountSize: 15,
      amountLineHeight: 20,
      badgeSize: 11,
      colGap: 10,
      amountColMax: 108,
    };
  }
  return {
    padH: 22,
    padV: 18,
    dateColW: 46,
    daySize: 18,
    monthSize: 11,
    titleSize: 17,
    titleLineHeight: 23,
    metaSize: 13,
    metaLineHeight: 18,
    amountSize: 16,
    amountLineHeight: 21,
    badgeSize: 12,
    colGap: 12,
    amountColMax: 124,
  };
}

function badgeColors(status: UpcomingPaymentItem['status']): {
  bg: string;
  fg: string;
} {
  if (status === 'overdue') {
    return { bg: '#F0E4E1', fg: '#8B4A3F' };
  }
  if (status === 'partial') {
    return { bg: '#E8E6E1', fg: colors.muted };
  }
  return { bg: '#E4EAE1', fg: '#4A5C45' };
}

function UpcomingPaymentRowComponent({ item, showDivider }: UpcomingPaymentRowProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const badge = badgeColors(item.status);

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
        <View style={[styles.dateCol, { width: layout.dateColW }]}>
          {item.dayLabel ? (
            <Text style={[styles.day, { fontSize: layout.daySize }]}>{item.dayLabel}</Text>
          ) : null}
          {item.monthLabel ? (
            <Text style={[styles.month, { fontSize: layout.monthSize }]}>{item.monthLabel}</Text>
          ) : null}
        </View>

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
              numberOfLines={2}
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
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeLabel, { fontSize: layout.badgeSize, color: badge.fg }]}>
              {item.statusLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export const UpcomingPaymentRow = memo(UpcomingPaymentRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateCol: {
    alignItems: 'flex-start',
    paddingTop: 2,
    flexShrink: 0,
  },
  day: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  month: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
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
  },
  badgeLabel: {
    fontFamily: fontFamily.manrope.regular,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
