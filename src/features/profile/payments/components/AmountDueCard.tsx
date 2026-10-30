/**
 * Payments → Amount due to Godwit card (client account ledger).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ClientPaymentsCard } from '@/lib/firebase/payments';
import { formatNextPaymentDueLabel } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type AmountDueCardProps = {
  card: ClientPaymentsCard;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 20,
      padV: 22,
      radius: 18,
      labelSize: 11,
      amountSize: 28,
      amountLineHeight: 34,
      bodySize: 13,
      bodyLineHeight: 18,
      footerSize: 13,
      footerLineHeight: 18,
      tagSize: 12,
    };
  }
  return {
    padH: 24,
    padV: 26,
    radius: 20,
    labelSize: 11,
    amountSize: 34,
    amountLineHeight: 40,
    bodySize: 14,
    bodyLineHeight: 20,
    footerSize: 14,
    footerLineHeight: 20,
    tagSize: 12,
  };
}

export function AmountDueCard({ card }: AmountDueCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  const dueFooter = useMemo(
    () => formatNextPaymentDueLabel(card.nextPaymentDue),
    [card.nextPaymentDue],
  );

  if (card.tag === 'none' && !card.hasLedger) {
    return (
      <View
        style={[
          styles.card,
          {
            borderRadius: layout.radius,
            paddingHorizontal: layout.padH,
            paddingVertical: layout.padV,
          },
        ]}
      >
        <Text style={[styles.empty, { fontSize: layout.bodySize }]}>No payments yet.</Text>
      </View>
    );
  }

  const heading = card.tag === 'credit' ? 'CREDIT WITH GODWIT' : 'AMOUNT DUE TO GODWIT';

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius,
          paddingHorizontal: layout.padH,
          paddingVertical: layout.padV,
        },
      ]}
    >
      <View style={styles.labelRow}>
        <Text style={[styles.label, { fontSize: layout.labelSize, letterSpacing: 0.8 }]}>
          {heading}
        </Text>
        {card.tagLabel ? (
          <View style={styles.tag}>
            <Text style={[styles.tagLabel, { fontSize: layout.tagSize }]}>{card.tagLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.amount,
          {
            fontSize: layout.amountSize,
            lineHeight: layout.amountLineHeight,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {card.amountDueLabel}
      </Text>

      <Text
        style={[
          styles.body,
          {
            fontSize: layout.bodySize,
            lineHeight: layout.bodyLineHeight,
          },
        ]}
      >
        Each currency is shown separately, exactly as invoiced.
      </Text>

      {dueFooter ? (
        <Text
          style={[
            styles.footer,
            {
              fontSize: layout.footerSize,
              lineHeight: layout.footerLineHeight,
            },
          ]}
        >
          {dueFooter}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#1B2915',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E8E6E1',
  },
  tagLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  amount: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    marginTop: 14,
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    textAlign: 'center',
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    textAlign: 'center',
  },
});
