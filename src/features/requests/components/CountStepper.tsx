/**
 * Compact +/- count control for request forms (rooms, adults, guests…).
 * Sizing matches Hotel Stay tab and scales with screen width.
 */
import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { requestFormFieldChrome } from '@/features/requests/shared/requestFormFieldChrome';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CountStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  accessibilityLabel?: string;
  /** Kept for callers; all sizes now follow Hotel Stay chrome. */
  size?: 'md' | 'sm';
};

function CountStepperComponent({
  value,
  onChange,
  min = 0,
  max = 20,
  accessibilityLabel = 'Count',
}: CountStepperProps) {
  const { width } = useWindowDimensions();
  const chrome = useMemo(() => requestFormFieldChrome(width), [width]);
  const canDecrement = value > min;
  const canIncrement = value < max;
  const btnSize = chrome.countButton;

  return (
    <View
      style={[
        styles.row,
        {
          gap: chrome.countGap,
          paddingHorizontal: chrome.countPad,
          paddingVertical: chrome.countPad,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
        disabled={!canDecrement}
        onPress={() => canDecrement && onChange(value - 1)}
        style={[
          styles.button,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
          !canDecrement && styles.buttonDisabled,
        ]}
        hitSlop={6}
      >
        <Ionicons
          name="remove"
          size={chrome.countIcon}
          color={canDecrement ? colors.forest : colors.muted}
        />
      </Pressable>
      <Text
        style={[
          styles.value,
          {
            minWidth: chrome.countValueMinWidth,
            fontSize: chrome.countValueSize,
          },
        ]}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${accessibilityLabel}`}
        disabled={!canIncrement}
        onPress={() => canIncrement && onChange(value + 1)}
        style={[
          styles.button,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
          !canIncrement && styles.buttonDisabled,
        ]}
        hitSlop={6}
      >
        <Ionicons
          name="add"
          size={chrome.countIcon}
          color={canIncrement ? colors.forest : colors.muted}
        />
      </Pressable>
    </View>
  );
}

export const CountStepper = memo(CountStepperComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    textAlign: 'center',
    fontFamily: fontFamily.manrope.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.forest,
  },
});
