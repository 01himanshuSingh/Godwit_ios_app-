/**
 * Inline labeled +/- row for rooms / passengers / bedrooms / guests.
 * Label + counter on one row; optional hint sits below in smaller text.
 */
import { memo, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CountStepper } from '@/features/requests/components/CountStepper';
import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { requestFormFieldChrome } from '@/features/requests/shared/requestFormFieldChrome';
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
  const { width } = useWindowDimensions();
  const chrome = useMemo(() => requestFormFieldChrome(width), [width]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text
          style={[styles.label, { fontSize: chrome.labelSize, letterSpacing: chrome.labelLetter }]}
          numberOfLines={1}
        >
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
        <Text
          style={[
            styles.hint,
            {
              fontSize: chrome.helperSize,
              lineHeight: chrome.helperLineHeight,
              marginTop: chrome.helperMarginTop,
            },
          ]}
          numberOfLines={1}
        >
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
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  hint: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
});
