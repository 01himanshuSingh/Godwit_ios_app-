/**
 * Labeled date field that opens the system date picker.
 */
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, isValid } from 'date-fns';
import { memo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type DateFieldPickerProps = {
  label: string;
  value: Date | null;
  onChange: (next: Date | null) => void;
  placeholder: string;
  minimumDate?: Date;
  accessibilityLabel?: string;
  error?: string | null;
};

function formatValue(value: Date | null): string {
  if (!value || !isValid(value)) return '';
  return format(value, 'd MMM yyyy');
}

function DateFieldPickerComponent({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  accessibilityLabel,
  error,
}: DateFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const display = formatValue(value);

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selected) {
      onChange(selected);
    }
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={() => setOpen(true)}
        style={[styles.input, error ? styles.inputError : null]}
      >
        <Text style={display ? styles.value : styles.placeholder}>{display || placeholder}</Text>
      </Pressable>
      <FieldErrorText message={error} />
      {open ? (
        <DateTimePicker
          value={value && isValid(value) ? value : minimumDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={onPickerChange}
        />
      ) : null}
      {Platform.OS === 'ios' && open ? (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const DateFieldPicker = memo(DateFieldPickerComponent);

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
  done: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    color: colors.accent,
  },
});
