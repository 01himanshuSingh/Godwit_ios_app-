/**
 * City Places search — thin wrapper over PlaceSearchSheet.
 */
import { PlaceSearchSheet } from '@/features/requests/wizard/sheets/PlaceSearchSheet';
import type { PlaceSuggestion } from '@/lib/places/googlePlacesAutocomplete';

type CitySearchSheetProps = {
  visible: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (place: PlaceSuggestion | { mainText: string; placeId: null }) => void;
};

export function CitySearchSheet({
  visible,
  initialQuery = '',
  onClose,
  onSelect,
}: CitySearchSheetProps) {
  return (
    <PlaceSearchSheet
      visible={visible}
      title="City"
      placeholder="Courchevel"
      initialQuery={initialQuery}
      placeType="cities"
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}
