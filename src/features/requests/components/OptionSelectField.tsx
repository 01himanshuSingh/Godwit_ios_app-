/**
 * Simple expandable option list for cabin / service type / inventory prefs.
 */
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import type { InventoryOption } from '@/features/requests/data/requestInventory';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type OptionSelectFieldProps = {
  label: string;
  options: readonly InventoryOption[];
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  optional?: boolean;
  error?: string | null;
};

function OptionSelectFieldComponent({
  label,
  options,
  value,
  onChange,
  placeholder,
  optional = false,
  error,
}: OptionSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value || option.label === value);
  const display = selected?.label || value;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? ' (OPTIONAL)' : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen((prev) => !prev)}
        style={[styles.input, error ? styles.inputError : null]}
      >
        <Text style={display ? styles.value : styles.placeholder}>{display || placeholder}</Text>
      </Pressable>
      <FieldErrorText message={error} />
      {open ? (
        <View style={styles.dropdown}>
          {optional ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onChange('');
                setOpen(false);
              }}
              style={styles.option}
            >
              <Text style={styles.optionLabel}>No preference</Text>
            </Pressable>
          ) : null}
          {options.map((option) => {
            const isSelected = option.id === value || option.label === value;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(option.label);
                  setOpen(false);
                }}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const OptionSelectField = memo(OptionSelectFieldComponent);

const styles = StyleSheet.create({
  field: {
    width: '100%',
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  input: {
    width: '100%',
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#B42318',
  },
  value: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 16,
    color: colors.forest,
  },
  placeholder: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 16,
    color: '#B5B1A8',
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: '#F4F7F1',
  },
  optionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
  },
  optionLabelSelected: {
    color: colors.accent,
  },
});
