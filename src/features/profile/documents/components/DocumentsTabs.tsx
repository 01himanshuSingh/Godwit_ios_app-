/**
 * Documents hub tabs — Trips | Personal.
 * Active 11 semibold · inactive 11 medium.
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
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityRole="tablist">
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
      <View style={styles.baseLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 22,
  },
  hit: {
    paddingBottom: 0,
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
  baseLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: -2,
  },
});
