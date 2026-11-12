/**
 * Places field with Google Autocomplete suggestions.
 * Manual entry is always allowed when the place is not in suggestions.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import { requestFormFieldChrome } from '@/features/requests/shared/requestFormFieldChrome';
import {
  fetchPlaceSuggestions,
  isPlacesApiConfigured,
  type PlaceAutocompleteType,
  type PlaceSuggestion,
} from '@/lib/places/googlePlacesAutocomplete';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type PlacesAutocompleteFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
  placeholder?: string;
  /** Defaults to cities. */
  placeType?: PlaceAutocompleteType;
  helperText?: string;
  error?: string | null;
};

export function PlacesAutocompleteField({
  label,
  value,
  onChangeText,
  onSelectPlace,
  placeholder = 'Search or type manually',
  placeType = 'cities',
  helperText = 'Type the place name.',
  error,
}: PlacesAutocompleteFieldProps) {
  const { width } = useWindowDimensions();
  const chrome = useMemo(() => requestFormFieldChrome(width), [width]);
  const placesConfigured = useMemo(() => isPlacesApiConfigured(), []);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  const query = value.trim();
  const canSuggest = placesConfigured && !suppressSuggestions && query.length >= 2;

  useEffect(() => {
    if (!canSuggest) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchPlaceSuggestions(query, {
        signal: controller.signal,
        type: placeType,
      }).then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        if (result.errorMessage && __DEV__) {
          console.warn('[PlacesAutocompleteField]', result.errorMessage);
        }
        setSuggestions(result.suggestions);
        setLoading(false);
      });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSuggest, placeType, query]);

  const visibleSuggestions = canSuggest ? suggestions : [];
  const visibleLoading = canSuggest && loading;

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
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setSuppressSuggestions(false);
            onChangeText(text);
          }}
          placeholder={placeholder}
          placeholderTextColor="#B5B1A8"
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error ? styles.inputError : null,
            {
              minHeight: chrome.inputHeight,
              borderRadius: chrome.inputRadius,
              paddingHorizontal: chrome.inputPadH,
              paddingVertical: chrome.inputPadV,
              fontSize: chrome.inputSize,
              lineHeight: chrome.inputLineHeight,
            },
          ]}
        />
        {visibleLoading ? (
          <ActivityIndicator
            style={[styles.spinner, { right: chrome.inputPadH, top: chrome.inputPadV + 2 }]}
            color={colors.accent}
          />
        ) : null}
      </View>

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

      {visibleSuggestions.length > 0 ? (
        <View style={styles.dropdown}>
          {visibleSuggestions.map((item) => (
            <Pressable
              key={item.placeId}
              accessibilityRole="button"
              accessibilityLabel={item.description}
              onPress={() => {
                setSuppressSuggestions(true);
                setSuggestions([]);
                onSelectPlace(item);
              }}
              style={styles.suggestion}
            >
              <Text style={styles.suggestionMain}>{item.mainText}</Text>
              {item.secondaryText ? (
                <Text style={styles.suggestionSecondary}>{item.secondaryText}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  inputWrap: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: '#B42318',
  },
  spinner: {
    position: 'absolute',
  },
  helper: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionMain: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
  },
  suggestionSecondary: {
    marginTop: 2,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
});
