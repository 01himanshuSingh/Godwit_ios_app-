/**
 * Labeled single-line / multiline request form field (WHERE / WHEN / ROOMS / notes).
 * Visual styles live on View / TextInput StyleSheet — not on Pressable function styles.
 */
import { memo, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native';

import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type RequestFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  helperText?: string;
  multiline?: boolean;
  minHeight?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  accessibilityLabel?: string;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      labelSize: 11,
      labelLetter: 1.4,
      inputPadH: 14,
      inputPadV: 12,
      inputRadius: 10,
      inputSize: 15,
      inputLineHeight: 20,
      helperSize: 12,
      helperLineHeight: 16,
      fieldGap: 8,
    };
  }
  return {
    labelSize: 11,
    labelLetter: 1.6,
    inputPadH: 16,
    inputPadV: 14,
    inputRadius: 10,
    inputSize: 16,
    inputLineHeight: 22,
    helperSize: 13,
    helperLineHeight: 18,
    fieldGap: 10,
  };
}

function RequestFormFieldComponent({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  multiline = false,
  minHeight,
  autoCapitalize = 'sentences',
  returnKeyType = 'done',
  accessibilityLabel,
}: RequestFormFieldProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, { gap: layout.fieldGap }]}>
      <Text
        style={[
          styles.label,
          {
            fontSize: layout.labelSize,
            letterSpacing: layout.labelLetter,
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B5B1A8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={autoCapitalize}
        returnKeyType={multiline ? 'default' : returnKeyType}
        accessibilityLabel={accessibilityLabel ?? label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.inputFocused,
          {
            borderRadius: layout.inputRadius,
            paddingHorizontal: layout.inputPadH,
            paddingTop: layout.inputPadV,
            paddingBottom: layout.inputPadV,
            fontSize: layout.inputSize,
            lineHeight: layout.inputLineHeight,
            minHeight: minHeight ?? (multiline ? 110 : undefined),
          },
        ]}
      />
      {helperText ? (
        <Text
          style={[
            styles.helper,
            {
              fontSize: layout.helperSize,
              lineHeight: layout.helperLineHeight,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export const RequestFormField = memo(RequestFormFieldComponent);

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  helper: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
});
