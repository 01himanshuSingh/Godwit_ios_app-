/**
 * Documents hub tabs — Trips | Personal.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type DocumentsTabId = 'trips' | 'personal';

type DocumentsTabsProps = {
  active: DocumentsTabId;
  onChange: (tab: DocumentsTabId) => void;
};

const TABS: { id: DocumentsTabId; label: string }[] = [
  { id: 'trips', label: 'Trips' },
  { id: 'personal', label: 'Personal' },
];

export function DocumentsTabs({ active, onChange }: DocumentsTabsProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  tab: {
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.forest,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.muted,
  },
  labelActive: {
    color: colors.forest,
  },
  pressed: {
    opacity: 0.7,
  },
});
