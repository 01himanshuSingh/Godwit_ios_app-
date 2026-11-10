/**
 * City field — thin wrapper over PlacesAutocompleteField (cities).
 */
import { PlacesAutocompleteField } from '@/features/requests/components/PlacesAutocompleteField';
import type { PlaceSuggestion } from '@/lib/places/googlePlacesAutocomplete';

type CityPlacesAutocompleteProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
  placeholder?: string;
  error?: string | null;
};

export function CityPlacesAutocomplete({
  label = 'CITY',
  value,
  onChangeText,
  onSelectPlace,
  placeholder = 'Courchevel',
  error,
}: CityPlacesAutocompleteProps) {
  return (
    <PlacesAutocompleteField
      label={label}
      value={value}
      onChangeText={onChangeText}
      onSelectPlace={onSelectPlace}
      placeholder={placeholder}
      placeType="cities"
      error={error}
    />
  );
}
