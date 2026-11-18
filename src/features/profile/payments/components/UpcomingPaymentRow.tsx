/**
 * One upcoming-payment row: sand date block | title+subtitle | amount+status.
 * CRM fields only from UpcomingPaymentItem.
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { UpcomingPaymentItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingPaymentRowProps = {
  item: UpcomingPaymentItem;
  showDivider: boolean;
};

function StatusBadge({ status, label }: { status: UpcomingPaymentItem['status']; label: string }) {
  if (status === 'overdue') {
    return (
      <View style={[styles.badge, styles.badgeOverdue]}>
        <View style={styles.overdueDot} />
        <Text style={styles.badgeOverdueLabel}>{label}</Text>
      </View>
    );
  }
  if (status === 'partial') {
    return (
      <View style={[styles.badge, styles.badgePartial]}>
        <Text style={styles.badgePartialLabel}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeDue]}>
      <Text style={styles.badgeDueLabel}>{label}</Text>
    </View>
  );
}

function UpcomingPaymentRowComponent({ item, showDivider }: UpcomingPaymentRowProps) {
  const hasDate = Boolean(item.dayLabel?.trim() || item.monthLabel?.trim());

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={styles.row}>
        {hasDate ? (
          <View style={styles.dateBlock}>
            {item.dayLabel?.trim() ? <Text style={styles.day}>{item.dayLabel.trim()}</Text> : null}
            {item.monthLabel?.trim() ? (
              <Text style={styles.month}>{item.monthLabel.trim()}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.dateBlockEmpty} />
        )}

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.subtitle?.trim() ? (
            <Text style={styles.subtitle} numberOfLines={2}>
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
          <StatusBadge status={item.status} label={item.statusLabel} />
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateBlock: {
    width: 44,
    borderRadius: 10,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  dateBlockEmpty: {
    width: 44,
    flexShrink: 0,
  },
  day: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.forest,
  },
  month: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 2,
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
    maxWidth: 118,
    paddingTop: 2,
  },
  amount: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    textAlign: 'right',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDue: {
    backgroundColor: colors.sand,
  },
  badgeDueLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  badgeOverdue: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B3A3A',
  },
  overdueDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#8B3A3A',
  },
  badgeOverdueLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: '#8B3A3A',
  },
  badgePartial: {
    backgroundColor: '#E8E6EF',
  },
  badgePartialLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.muted,
  },
  divider: {
    marginLeft: 72,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
