/**
 * Primary CTA under request forms — UI only until submit API lands.
 */
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type SendToGodwitButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
};

function SendToGodwitButtonComponent({ onPress, disabled = false }: SendToGodwitButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send to Godwit"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.pressable}
    >
      <View style={[styles.button, disabled && styles.buttonDisabled]}>
        <Text style={styles.label}>Send to Godwit</Text>
      </View>
    </Pressable>
  );
}

export const SendToGodwitButton = memo(SendToGodwitButtonComponent);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  button: {
    width: '100%',
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.sand,
  },
});
