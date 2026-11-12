/**
 * Compact segmented tabs for trip type / arrival-departure / charter type.
 */
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { InventoryOption } from '@/features/requests/data/requestInventory';
import { requestFormFieldChrome } from '@/features/requests/shared/requestFormFieldChrome';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type SegmentedTabsProps = {
  label: string;
  options: readonly InventoryOption[];
  value: string;
  onChange: (next: string) => void;
};

function SegmentedTabsComponent({ label, options, value, onChange }: SegmentedTabsProps) {
  const { width } = useWindowDimensions();
  const chrome = useMemo(() => requestFormFieldChrome(width), [width]);

  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.label,
          {
            fontSize: chrome.labelSize,
            letterSpacing: chrome.labelLetter,
            marginBottom: chrome.labelMarginBottom,
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const SegmentedTabs = memo(SegmentedTabsComponent);

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    flexGrow: 1,
    minWidth: '28%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F4F7F1',
  },
  tabLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.forest,
    textAlign: 'center',
  },
  tabLabelSelected: {
    color: colors.accent,
  },
});
