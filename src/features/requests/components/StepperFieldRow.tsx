/**
 * Inline labeled +/- row for rooms / passengers / bedrooms / guests.
 * Label + counter on one row; optional hint sits below in smaller text.
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CountStepper } from '@/features/requests/components/CountStepper';
import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type StepperFieldRowProps = {
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  error?: string | null;
};

function StepperFieldRowComponent({
  label,
  hint,
  value,
  onChange,
  min = 1,
  max = 50,
  error,
}: StepperFieldRowProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <CountStepper
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          accessibilityLabel={label}
        />
      </View>
      {hint ? (
        <Text style={styles.hint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
      <FieldErrorText message={error} />
    </View>
  );
}

export const StepperFieldRow = memo(StepperFieldRowComponent);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    flex: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  hint: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
});
