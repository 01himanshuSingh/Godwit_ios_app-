/**
 * Google Places Autocomplete (New) for request forms.
 * POST https://places.googleapis.com/v1/places:autocomplete
 *
 * Requires EXPO_PUBLIC_GOOGLE_PLACES_API_KEY with **Places API (New)** enabled
 * (not the legacy Place Autocomplete API).
 * Manual free-text is always allowed in the UI when a place is not listed.
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

/** Place type filters used by request forms (mapped to Places API New). */
export type PlaceAutocompleteType =
  'cities' | 'geocode' | 'establishment' | 'airport' | 'lodging' | 'regions';

export type FetchPlaceSuggestionsOptions = {
  signal?: AbortSignal;
  /** Defaults to cities. */
  type?: PlaceAutocompleteType;
};

type PlacePrediction = {
  placeId?: string;
  place?: string;
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
};

type AutocompleteSuggestion = {
  placePrediction?: PlacePrediction;
};

type AutocompleteResponse = {
  suggestions?: AutocompleteSuggestion[];
  error?: { message?: string; status?: string };
  error_message?: string;
};

function getPlacesApiKey(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '').trim();
}

/** True when a Places API key is present (does not prove the API is enabled). */
export function isPlacesApiConfigured(): boolean {
  return getPlacesApiKey().length > 0;
}

/**
 * Maps app place filters → Places API (New) `includedPrimaryTypes`.
 * `(cities)` / `(regions)` are still supported by Autocomplete (New).
 */
function toIncludedPrimaryTypes(type: PlaceAutocompleteType): string[] | undefined {
  switch (type) {
    case 'cities':
      return ['(cities)'];
    case 'regions':
      return ['(regions)'];
    case 'geocode':
      // Broad address / place search — no primary-type filter.
      return undefined;
    case 'establishment':
      return ['establishment'];
    case 'airport':
      return ['airport'];
    case 'lodging':
      return ['lodging'];
    default:
      return ['(cities)'];
  }
}

function extractPlaceId(prediction: PlacePrediction): string {
  const direct = String(prediction.placeId || '').trim();
  if (direct) return direct;
  const resource = String(prediction.place || '').trim();
  if (resource.startsWith('places/')) {
    return resource.slice('places/'.length);
  }
  return resource;
}

/**
 * Place / city / airport autocomplete. Debounce in the UI before calling.
 */
export async function fetchPlaceSuggestions(
  input: string,
  options: FetchPlaceSuggestionsOptions = {},
): Promise<PlacesAutocompleteResult> {
  const query = input.trim();
  if (query.length < 2) {
    return { suggestions: [], errorMessage: null };
  }

  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    // No key / Places not connected — silent. UI still accepts manual typing.
    if (__DEV__) {
      console.warn(
        '[fetchPlaceSuggestions] EXPO_PUBLIC_GOOGLE_PLACES_API_KEY missing; suggestions disabled.',
      );
    }
    return { suggestions: [], errorMessage: null };
  }

  const body: {
    input: string;
    languageCode: string;
    includedPrimaryTypes?: string[];
  } = {
    input: query,
    languageCode: 'en',
  };

  const includedPrimaryTypes = toIncludedPrimaryTypes(options.type ?? 'cities');
  if (includedPrimaryTypes?.length) {
    body.includedPrimaryTypes = includedPrimaryTypes;
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as AutocompleteResponse;

    if (!response.ok) {
      if (__DEV__) {
        console.warn(
          '[fetchPlaceSuggestions]',
          data.error?.message || data.error_message || `HTTP ${response.status}`,
        );
      }
      // Never surface Places API / key / enablement errors in the UI.
      return { suggestions: [], errorMessage: null };
    }

    const suggestions: PlaceSuggestion[] = (data.suggestions || [])
      .map((item) => item.placePrediction)
      .filter((prediction): prediction is PlacePrediction => Boolean(prediction))
      .map((prediction) => {
        const description = String(prediction.text?.text || '').trim();
        const mainText = String(prediction.structuredFormat?.mainText?.text || description).trim();
        const secondaryText = String(prediction.structuredFormat?.secondaryText?.text || '').trim();
        return {
          placeId: extractPlaceId(prediction),
          description,
          mainText,
          secondaryText,
        };
      })
      .filter((s) => s.placeId && s.description);

    return { suggestions, errorMessage: null };
  } catch (error) {
    if (options.signal?.aborted) {
      return { suggestions: [], errorMessage: null };
    }
    console.warn('[fetchPlaceSuggestions]', error);
    return { suggestions: [], errorMessage: null };
  }
}

/** @deprecated Prefer fetchPlaceSuggestions({ type: 'cities' }) */
export async function fetchCityPlaceSuggestions(
  input: string,
  signal?: AbortSignal,
): Promise<PlacesAutocompleteResult> {
  return fetchPlaceSuggestions(input, { signal, type: 'cities' });
}
