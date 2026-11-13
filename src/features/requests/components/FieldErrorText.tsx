/**
 * Inline validation message under a request form field.
 */
import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { fontFamily } from '@/ui/tokens/typography';

type FieldErrorTextProps = {
  message?: string | null;
};

function FieldErrorTextComponent({ message }: FieldErrorTextProps) {
  if (!message?.trim()) return null;
  return <Text style={styles.error}>{message.trim()}</Text>;
}

export const FieldErrorText = memo(FieldErrorTextComponent);

const styles = StyleSheet.create({
  error: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#A33A2E',
  },
});
