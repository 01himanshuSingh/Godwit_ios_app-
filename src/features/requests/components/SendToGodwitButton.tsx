/**
 * Primary CTA under request forms — submits via useSubmitServiceRequest.
 */
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type SendToGodwitButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function SendToGodwitButtonComponent({
  onPress,
  disabled = false,
  loading = false,
}: SendToGodwitButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send to Godwit"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={styles.pressable}
    >
      <View style={[styles.button, isDisabled && styles.buttonDisabled]}>
        {loading ? (
          <ActivityIndicator color={colors.sand} />
        ) : (
          <Text style={styles.label}>Send to Godwit</Text>
        )}
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
