/**
 * Home → payments attention card (due or credit).
 * Slim mobile layout; data from getHomePaymentsDue unchanged.
 * Visual styles on View; Pressable is a plain touch wrapper only.
 */
import Feather from '@expo/vector-icons/Feather';
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

export function PaymentsDueCard({ card, onViewPayments }: PaymentsDueCardProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);

  if (!card.lines.length) return null;

  const primaryLine = card.lines[0]!;
  const isDue = card.mode === 'due';
  const badgeLabel = isDue ? 'Action required' : 'Credit available';

  return (
    <View style={[styles.section, { paddingHorizontal: inset }]}>
      <Text style={styles.sectionEyebrow}>NEEDS YOUR ATTENTION</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardLabel} numberOfLines={1}>
            {card.sectionLabel}
          </Text>
          <View style={[styles.badge, isDue ? styles.badgeDue : styles.badgeCredit]}>
            <Text style={[styles.badgeText, isDue ? styles.badgeTextDue : styles.badgeTextCredit]}>
              {badgeLabel}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.amountBlock}>
          <Text
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {primaryLine.amountLabel}
          </Text>
          {card.lines.length > 1
            ? card.lines.slice(1).map((line) => (
                <Text
                  key={line.currency}
                  style={styles.amountSecondary}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {line.amountLabel}
                </Text>
              ))
            : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View payments"
          onPress={onViewPayments}
          hitSlop={8}
          style={styles.pressable}
        >
          <View style={styles.linkRow}>
            <Text style={styles.linkLabel}>View payments</Text>
            <Feather name="arrow-right" size={13} color={colors.forest} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    gap: 8,
  },
  sectionEyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    letterSpacing: 10 * 0.12,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  badge: {
    flexShrink: 0,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDue: {
    backgroundColor: '#F3E4E1',
  },
  badgeCredit: {
    backgroundColor: '#E4EAE1',
  },
  badgeText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
  },
  badgeTextDue: {
    color: '#8B4A3F',
  },
  badgeTextCredit: {
    color: '#4A5C45',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 10,
    marginBottom: 10,
  },
  amountBlock: {
    gap: 2,
    marginBottom: 10,
  },
  amount: {
    // Spec: 24 Semibold serif — Cormorant has no 600; Medium is closest.
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 24,
    lineHeight: 28,
    color: colors.forest,
  },
  amountSecondary: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 16,
    lineHeight: 20,
    color: colors.forest,
  },
  pressable: {
    alignSelf: 'flex-end',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    color: colors.forest,
  },
});
