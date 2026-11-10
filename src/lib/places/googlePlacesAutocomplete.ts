/**
 * Google Places Autocomplete (HTTP) — city suggestions for request forms.
 * Requires EXPO_PUBLIC_GOOGLE_PLACES_API_KEY (Places API / Places API (New) enabled).
 */

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type PlacesAutocompleteResult = {
  suggestions: PlaceSuggestion[];
  errorMessage: string | null;
};

function getPlacesApiKey(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '').trim();
}

/**
 * City / locality autocomplete. Debounce in the UI before calling.
 */
export async function fetchCityPlaceSuggestions(
  input: string,
  signal?: AbortSignal,
): Promise<PlacesAutocompleteResult> {
  const query = input.trim();
  if (query.length < 2) {
    return { suggestions: [], errorMessage: null };
  }

  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    return {
      suggestions: [],
      errorMessage: __DEV__
        ? 'Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to enable city suggestions.'
        : null,
    };
  }

  const url =
    'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
    new URLSearchParams({
      input: query,
      types: '(cities)',
      key: apiKey,
    }).toString();

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return { suggestions: [], errorMessage: 'Could not load city suggestions.' };
    }

    const data = (await response.json()) as {
      status?: string;
      error_message?: string;
      predictions?: {
        place_id?: string;
        description?: string;
        structured_formatting?: {
          main_text?: string;
          secondary_text?: string;
        };
      }[];
    };

    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return {
        suggestions: [],
        errorMessage:
          data.error_message ||
          (__DEV__ ? `Places status: ${data.status}` : 'Could not load city suggestions.'),
      };
    }

    const suggestions: PlaceSuggestion[] = (data.predictions || [])
      .map((p) => ({
        placeId: String(p.place_id || '').trim(),
        description: String(p.description || '').trim(),
        mainText: String(p.structured_formatting?.main_text || p.description || '').trim(),
        secondaryText: String(p.structured_formatting?.secondary_text || '').trim(),
      }))
      .filter((s) => s.placeId && s.description);

    return { suggestions, errorMessage: null };
  } catch (error) {
    if (signal?.aborted) {
      return { suggestions: [], errorMessage: null };
    }
    console.warn('[fetchCityPlaceSuggestions]', error);
    return { suggestions: [], errorMessage: 'Could not load city suggestions.' };
  }
}
