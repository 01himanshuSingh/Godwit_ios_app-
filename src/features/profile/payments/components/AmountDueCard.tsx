/**
 * Payments → Amount due hero (client ledger).
 * Type scale: label 9 · badge 9 · amount 25 serif · body 11 · footer 10.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ClientPaymentsCard } from '@/lib/firebase/payments';
import { formatNextPaymentDueLabel } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type AmountDueCardProps = {
  card: ClientPaymentsCard;
  /** Optional override when card.nextPaymentDue is empty — e.g. earliest upcoming date. */
  nextPaymentDue?: string | null;
};

export function AmountDueCard({ card, nextPaymentDue }: AmountDueCardProps) {
  const { width } = useWindowDimensions();
  const amountSize = width < 360 ? 22 : 25;
  const amountLineHeight = width < 360 ? 28 : 30;

  const dueFooter = useMemo(
    () => formatNextPaymentDueLabel(nextPaymentDue ?? card.nextPaymentDue),
    [nextPaymentDue, card.nextPaymentDue],
  );

  if (card.tag === 'none' && !card.hasLedger) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.empty}>No payments yet.</Text>
      </View>
    );
  }

  const heading = card.tag === 'credit' ? 'CREDIT WITH GODWIT' : 'AMOUNT DUE TO GODWIT';

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.labelRow}>
        <Text style={styles.label}>{heading}</Text>
        {card.tagLabel ? (
          <View style={styles.tag}>
            <Text style={styles.tagLabel}>{card.tagLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[styles.amount, { fontSize: amountSize, lineHeight: amountLineHeight }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {card.amountDueLabel}
      </Text>

      <Text style={styles.body}>Each currency is shown separately, exactly as invoiced.</Text>

      {dueFooter ? (
        <>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <Feather name="calendar" size={11} color="rgba(247, 246, 244, 0.7)" />
            <Text style={styles.footer}>{dueFooter}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.forest,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  emptyCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    letterSpacing: 0.9,
    color: 'rgba(247, 246, 244, 0.72)',
    textTransform: 'uppercase',
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.sand,
  },
  tagLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  amount: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.primaryForeground,
    marginBottom: 10,
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(247, 246, 244, 0.62)',
    maxWidth: 320,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(247, 246, 244, 0.18)',
    marginTop: 14,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    flex: 1,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(247, 246, 244, 0.7)',
  },
});
