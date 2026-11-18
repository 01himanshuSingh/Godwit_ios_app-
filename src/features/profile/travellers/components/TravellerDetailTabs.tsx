/**
 * Traveller detail section tabs — Personal / Documents / Loyalty / Hotels / Air.
 * Pressable-plain; underline marks the active tab.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type TravellerDetailTabId = 'personal' | 'documents' | 'loyalty' | 'hotels' | 'air';

const TABS: { id: TravellerDetailTabId; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'documents', label: 'Documents' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'air', label: 'Air' },
];

type TravellerDetailTabsProps = {
  active: TravellerDetailTabId;
  onChange: (tab: TravellerDetailTabId) => void;
};

export function TravellerDetailTabs({ active, onChange }: TravellerDetailTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 22,
    paddingRight: 8,
  },
  hit: {
    paddingBottom: 0,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    lineHeight: 20,
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
