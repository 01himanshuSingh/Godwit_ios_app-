/**
 * Payments → UPCOMING PAYMENTS.
 * White card with date | title | amount+status rows. Empty → same card shell.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { UpcomingPaymentRow } from '@/features/profile/payments/components/UpcomingPaymentRow';
import type { UpcomingPaymentItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingPaymentsListCardProps = {
  items: UpcomingPaymentItem[];
  /** When account has no due balance — still show empty card. */
  hasDue?: boolean;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      sectionSize: 10,
      labelToList: 10,
      radius: 16,
      emptyPadH: 16,
      emptyPadV: 14,
    };
  }
  if (width < 400) {
    return {
      sectionSize: 11,
      labelToList: 12,
      radius: 18,
      emptyPadH: 18,
      emptyPadV: 16,
    };
  }
  return {
    sectionSize: 11,
    labelToList: 14,
    radius: 20,
    emptyPadH: 22,
    emptyPadV: 20,
  };
}

export function UpcomingPaymentsListCard({ items }: UpcomingPaymentsListCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionLabel,
          {
            fontSize: layout.sectionSize,
            letterSpacing: 1.2,
            marginBottom: layout.labelToList,
          },
        ]}
      >
        UPCOMING PAYMENTS
      </Text>

      <View style={[styles.card, { borderRadius: layout.radius }]}>
        {items.length === 0 ? (
          <View
            style={{
              paddingHorizontal: layout.emptyPadH,
              paddingVertical: layout.emptyPadV,
            }}
          >
            <Text style={styles.empty}>No upcoming payments.</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <UpcomingPaymentRow
              key={item.entryId || `${item.saleId}-${index}`}
              item={item}
              showDivider={index > 0}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#1B2915',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
  },
});
