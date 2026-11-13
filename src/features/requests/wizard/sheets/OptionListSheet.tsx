import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { InventoryOption } from '@/features/requests/data/requestInventory';
import { SheetModal } from '@/features/requests/wizard/sheets/SheetModal';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type OptionListSheetProps = {
  visible: boolean;
  title: string;
  options: readonly InventoryOption[];
  value: string;
  /** Match against option.label (default) or option.id */
  matchBy?: 'label' | 'id';
  emptyLabel?: string;
  onClose: () => void;
  onSelect: (option: InventoryOption | null) => void;
};

export function OptionListSheet({
  visible,
  title,
  options,
  value,
  matchBy = 'label',
  emptyLabel,
  onClose,
  onSelect,
}: OptionListSheetProps) {
  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      leftAction={{ label: 'Cancel', onPress: onClose }}
      heightRatio={0.62}
    >
      <ScrollView>
        {emptyLabel ? (
          <Pressable
            style={styles.row}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <View style={[styles.dot, !value && styles.dotSelected]} />
            <Text style={styles.rowLabel}>{emptyLabel}</Text>
          </Pressable>
        ) : null}
        {options.map((option) => {
          const selected = matchBy === 'id' ? value === option.id : value === option.label;
          return (
            <Pressable
              key={option.id}
              style={styles.row}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <View style={[styles.dot, selected && styles.dotSelected]} />
              <Text style={styles.rowLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  dotSelected: {
    borderColor: colors.forest,
    backgroundColor: colors.forest,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
  },
});
