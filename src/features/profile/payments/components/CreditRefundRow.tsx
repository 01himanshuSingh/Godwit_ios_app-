/**
 * One credits/refunds row — return icon · Refund · date·doc·particulars · –USD + status.
 * CRM CreditRefundItem fields only.
 */
import Feather from '@expo/vector-icons/Feather';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CreditRefundItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CreditRefundRowProps = {
  item: CreditRefundItem;
  showDivider: boolean;
};

function CreditRefundRowComponent({ item, showDivider }: CreditRefundRowProps) {
  const status = item.statusLabel?.trim();

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={styles.row}>
        <View style={styles.iconWell}>
          <Feather name="corner-down-left" size={16} color={colors.forest} />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          {item.subtitle?.trim() ? (
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {item.subtitle.trim()}
            </Text>
          ) : null}
        </View>

        <View style={styles.amountCol}>
          <Text
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {item.amountLabel}
          </Text>
          {status ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{status.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const CreditRefundRow = memo(CreditRefundRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
    maxWidth: 128,
  },
  amount: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.sand,
  },
  badgeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.4,
    color: colors.forest,
  },
  divider: {
    marginLeft: 66,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
