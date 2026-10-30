/**
 * Home → PAYMENTS DUE (after current-trip card).
 * Data: client ledger via getHomePaymentsDue (USD today; multi-currency-ready lines).
 */
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import type { HomePaymentsDueCard } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type PaymentsDueCardProps = {
  card: HomePaymentsDueCard;
  onViewPayments?: () => void;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 18,
      radius: 16,
      amountSize: 22,
      amountLineHeight: 28,
      amountGap: 20,
      linkSize: 14,
    };
  }
  return {
    padH: 22,
    padV: 20,
    radius: 18,
    amountSize: 26,
    amountLineHeight: 32,
    amountGap: 28,
    linkSize: 15,
  };
}

export function PaymentsDueCard({ card, onViewPayments }: PaymentsDueCardProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);
  const layout = useMemo(() => layoutForWidth(width), [width]);

  if (!card.lines.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: inset }]}>
      <Text style={styles.sectionLabel}>{card.sectionLabel}</Text>

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
        <View style={[styles.amountsRow, { gap: layout.amountGap }]}>
          {card.lines.map((line) => (
            <Text
              key={line.currency}
              style={[
                styles.amount,
                {
                  fontSize: layout.amountSize,
                  lineHeight: layout.amountLineHeight,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {line.amountLabel}
            </Text>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View payments"
          onPress={onViewPayments}
          hitSlop={8}
          style={({ pressed }) => [styles.linkHit, pressed && styles.pressed]}
        >
          <Text style={[styles.linkLabel, { fontSize: layout.linkSize }]}>View payments</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  amountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  amount: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
    flexShrink: 1,
  },
  linkHit: {
    alignSelf: 'flex-start',
  },
  linkLabel: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
