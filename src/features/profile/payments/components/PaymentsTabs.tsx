/**
 * Payments section tabs — Upcoming / Invoices / Received / Credits.
 * Active 11 semibold · inactive 11 medium.
 * Plain View (not nested ScrollView) so parent stickyHeaderIndices works.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type PaymentsTabId = 'upcoming' | 'invoices' | 'received' | 'credits';

const TABS: { id: PaymentsTabId; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'received', label: 'Received' },
  { id: 'credits', label: 'Credits' },
];

type PaymentsTabsProps = {
  active: PaymentsTabId;
  onChange: (tab: PaymentsTabId) => void;
};

export function PaymentsTabs({ active, onChange }: PaymentsTabsProps) {
  return (
    <View style={styles.root} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={styles.hit}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
            <View style={[styles.underline, selected && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'nowrap',
    gap: 22,
    backgroundColor: colors.background,
  },
  hit: {
    paddingBottom: 0,
    flexShrink: 1,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    paddingBottom: 10,
  },
  labelActive: {
    fontFamily: fontFamily.manrope.semibold,
    color: colors.forest,
  },
  underline: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.forest,
  },
});
