/**
 * Labeled date or date+time field using the system picker.
 */
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, isValid } from 'date-fns';
import { memo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type DateTimeFieldPickerProps = {
  label: string;
  value: Date | null;
  onChange: (next: Date | null) => void;
  placeholder: string;
  mode?: 'date' | 'datetime' | 'time';
  minimumDate?: Date;
  accessibilityLabel?: string;
  error?: string | null;
};

function formatValue(value: Date | null, mode: 'date' | 'datetime' | 'time'): string {
  if (!value || !isValid(value)) return '';
  if (mode === 'time') return format(value, 'h:mm a');
  if (mode === 'datetime') return format(value, 'd MMM yyyy · h:mm a');
  return format(value, 'd MMM yyyy');
}

function DateTimeFieldPickerComponent({
  label,
  value,
  onChange,
  placeholder,
  mode = 'date',
  minimumDate,
  accessibilityLabel,
  error,
}: DateTimeFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');
  const display = formatValue(value, mode);

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') {
        setOpen(false);
        setAndroidStep('date');
      }
      return;
    }
    if (!selected) return;

    if (Platform.OS === 'android' && mode === 'datetime') {
      if (androidStep === 'date') {
        onChange(selected);
        setAndroidStep('time');
        return;
      }
      const base = value && isValid(value) ? value : selected;
      const merged = new Date(base);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(merged);
      setOpen(false);
      setAndroidStep('date');
      return;
    }

    if (Platform.OS === 'android') {
      setOpen(false);
    }
    onChange(selected);
  }

  const pickerMode =
    Platform.OS === 'android' && mode === 'datetime'
      ? androidStep
      : mode === 'datetime'
        ? 'datetime'
        : mode;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={() => {
          setAndroidStep('date');
          setOpen(true);
        }}
        style={[styles.input, error ? styles.inputError : null]}
      >
        <Text style={display ? styles.value : styles.placeholder}>{display || placeholder}</Text>
      </Pressable>
      <FieldErrorText message={error} />
      {open ? (
        <DateTimePicker
          value={value && isValid(value) ? value : minimumDate || new Date()}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={mode === 'time' ? undefined : minimumDate}
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

export const DateTimeFieldPicker = memo(DateTimeFieldPickerComponent);

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
