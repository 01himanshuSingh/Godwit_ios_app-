/**
 * Home quick actions — New request + Payments.
 * Visual styles on View; Pressable is a plain touch wrapper only.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type HomeQuickActionsProps = {
  onNewRequest?: () => void;
  onPayments?: () => void;
};

export function HomeQuickActions({ onNewRequest, onPayments }: HomeQuickActionsProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);

  return (
    <View style={[styles.row, { paddingHorizontal: inset }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New request"
        onPress={onNewRequest}
        style={styles.pressable}
      >
        <View style={[styles.tile, styles.tilePrimary]}>
          <View style={styles.primaryIconWell}>
            <Feather name="plus" size={13} color={colors.sand} />
          </View>
          <Text style={styles.primaryLabel} numberOfLines={1}>
            New request
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Payments"
        onPress={onPayments}
        style={styles.pressable}
      >
        <View style={[styles.tile, styles.tileSecondary]}>
          <View style={styles.secondaryIconSlot}>
            <Feather name="credit-card" size={14} color={colors.forest} />
          </View>
          <Text style={styles.secondaryLabel} numberOfLines={1}>
            Payments
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  pressable: {
    flex: 1,
  },
  tile: {
    width: '100%',
    minHeight: 72,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tilePrimary: {
    backgroundColor: colors.forest,
  },
  tileSecondary: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  primaryIconWell: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(216, 205, 184, 0.22)',
  },
  secondaryIconSlot: {
    width: 26,
    height: 26,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.sand,
  },
  secondaryLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },
});
