import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SheetModal } from '@/features/requests/wizard/sheets/SheetModal';
import {
  fetchPlaceSuggestions,
  isPlacesApiConfigured,
  type PlaceAutocompleteType,
  type PlaceSuggestion,
} from '@/lib/places/googlePlacesAutocomplete';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type PlaceSearchSheetProps = {
  visible: boolean;
  title?: string;
  placeholder?: string;
  initialQuery?: string;
  placeType?: PlaceAutocompleteType;
  onClose: () => void;
  onSelect: (place: PlaceSuggestion | { mainText: string; placeId: null }) => void;
};

export function PlaceSearchSheet({
  visible,
  title = 'Search',
  placeholder = 'Search…',
  initialQuery = '',
  placeType = 'cities',
  onClose,
  onSelect,
}: PlaceSearchSheetProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [wasVisible, setWasVisible] = useState(visible);
  const configured = useMemo(() => isPlacesApiConfigured(), []);

  // Sync query when the sheet opens (adjust state during render — not an effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setQuery(initialQuery);
      setSuggestions([]);
      setLoading(false);
    }
  }

  const canSearch = visible && configured && query.trim().length >= 2;
  const shownSuggestions = canSearch ? suggestions : [];

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      void fetchPlaceSuggestions(query.trim(), {
        signal: controller.signal,
        type: placeType,
      }).then((result) => {
        if (controller.signal.aborted) return;
        setSuggestions(result.suggestions);
        setLoading(false);
      });
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [canSearch, placeType, query]);

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      leftAction={{ label: 'Cancel', onPress: onClose }}
    >
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#B5B1A8"
          autoFocus
          style={styles.searchInput}
          accessibilityLabel={title}
        />
        {loading && canSearch ? (
          <ActivityIndicator style={styles.spinner} color={colors.accent} />
        ) : null}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {query.trim().length > 0 ? (
          <Pressable
            style={styles.row}
            onPress={() => {
              onSelect({ mainText: query.trim(), placeId: null });
              onClose();
            }}
          >
            <Text style={styles.rowMain}>Use “{query.trim()}”</Text>
            <Text style={styles.rowSub}>Enter manually</Text>
          </Pressable>
        ) : null}
        {shownSuggestions.map((item) => (
          <Pressable
            key={item.placeId}
            style={styles.row}
            onPress={() => {
              onSelect(item);
              onClose();
            }}
          >
            <Text style={styles.rowMain}>{item.mainText}</Text>
            {item.secondaryText ? <Text style={styles.rowSub}>{item.secondaryText}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: 8,
    position: 'relative',
  },
  searchInput: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    color: colors.forest,
    backgroundColor: '#FFFFFF',
  },
  spinner: {
    position: 'absolute',
    right: 14,
    top: 16,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 2,
  },
  rowMain: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
  },
  rowSub: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
});
