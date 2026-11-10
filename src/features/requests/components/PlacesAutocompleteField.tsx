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
import {
  fetchPlaceSuggestions,
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

function layoutForWidth(width: number) {
  if (width < 360) {
    return { labelSize: 11, inputPadH: 14, inputPadV: 12, inputSize: 15 };
  }
  return { labelSize: 11, inputPadH: 16, inputPadV: 14, inputSize: 16 };
}

export function PlacesAutocompleteField({
  label,
  value,
  onChangeText,
  onSelectPlace,
  placeholder = 'Search or type manually',
  placeType = 'cities',
  helperText = 'Pick a suggestion, or type your own if it is not listed.',
  error,
}: PlacesAutocompleteFieldProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  const query = value.trim();
  const canSuggest = !suppressSuggestions && query.length >= 2;

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
        setSuggestions(result.suggestions);
        setErrorMessage(result.errorMessage);
        setLoading(false);
      });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSuggest, placeType, query]);

  const visibleSuggestions = canSuggest ? suggestions : [];
  const visibleError = canSuggest ? errorMessage : null;
  const visibleLoading = canSuggest && loading;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontSize: layout.labelSize }]}>{label}</Text>
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
              paddingHorizontal: layout.inputPadH,
              paddingVertical: layout.inputPadV,
              fontSize: layout.inputSize,
            },
          ]}
        />
        {visibleLoading ? <ActivityIndicator style={styles.spinner} color={colors.accent} /> : null}
      </View>

      <FieldErrorText message={error} />
      {!error && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      {visibleError && __DEV__ ? <Text style={styles.helper}>{visibleError}</Text> : null}

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
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.manrope.medium,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  inputWrap: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    borderRadius: 10,
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
    right: 14,
    top: 14,
  },
  helper: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
  dropdown: {
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
