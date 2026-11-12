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

import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { requestFormFieldChrome } from '@/features/requests/shared/requestFormFieldChrome';
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
  error?: string | null;
};

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
  error,
}: RequestFormFieldProps) {
  const { width } = useWindowDimensions();
  const chrome = useMemo(() => requestFormFieldChrome(width), [width]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.label,
          {
            fontSize: chrome.labelSize,
            letterSpacing: chrome.labelLetter,
            marginBottom: chrome.labelMarginBottom,
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
          error ? styles.inputError : null,
          {
            borderRadius: chrome.inputRadius,
            paddingHorizontal: chrome.inputPadH,
            paddingTop: chrome.inputPadV,
            paddingBottom: chrome.inputPadV,
            fontSize: chrome.inputSize,
            lineHeight: chrome.inputLineHeight,
            minHeight: minHeight ?? (multiline ? 110 : chrome.inputHeight),
          },
        ]}
      />
      <FieldErrorText message={error} />
      {!error && helperText ? (
        <Text
          style={[
            styles.helper,
            {
              fontSize: chrome.helperSize,
              lineHeight: chrome.helperLineHeight,
              marginTop: chrome.helperMarginTop,
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
    color: colors.fieldLabel,
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
  inputError: {
    borderColor: '#B42318',
  },
  helper: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
});
