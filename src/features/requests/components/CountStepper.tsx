/**
 * Compact +/- count control for request forms (rooms, adults, …).
 */
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CountStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  accessibilityLabel?: string;
};

function CountStepperComponent({
  value,
  onChange,
  min = 0,
  max = 20,
  accessibilityLabel = 'Count',
}: CountStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
        disabled={!canDecrement}
        onPress={() => canDecrement && onChange(value - 1)}
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
      >
        <Ionicons name="remove" size={18} color={canDecrement ? colors.forest : colors.muted} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${accessibilityLabel}`}
        disabled={!canIncrement}
        onPress={() => canIncrement && onChange(value + 1)}
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
      >
        <Ionicons name="add" size={18} color={canIncrement ? colors.forest : colors.muted} />
      </Pressable>
    </View>
  );
}

export const CountStepper = memo(CountStepperComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  value: {
    minWidth: 22,
    textAlign: 'center',
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    color: colors.forest,
  },
});
