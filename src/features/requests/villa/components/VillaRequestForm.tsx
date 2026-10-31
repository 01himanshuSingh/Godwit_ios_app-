/**
 * Villa request form — WHERE / WHEN / BEDROOMS + notes, travellers, send CTA.
 * Travellers list is mock data until CRM travellers API is wired.
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { TravellersSelectionCard } from '@/features/requests/components/TravellersSelectionCard';
import { MOCK_REQUEST_TRAVELLERS } from '@/features/requests/data/mockRequestTravellers';
import { colors } from '@/ui/tokens/colors';

export type VillaRequestFormValues = {
  destination: string;
  dates: string;
  bedrooms: string;
  additionalInformation: string;
  travellerIds: string[];
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return { cardPad: 16, cardRadius: 16, cardGap: 18, sectionGap: 14 };
  }
  return { cardPad: 20, cardRadius: 18, cardGap: 22, sectionGap: 16 };
}

export function VillaRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [selectedTravellerIds, setSelectedTravellerIds] = useState<string[]>([]);

  const onToggleTraveller = useCallback((travellerId: string) => {
    setSelectedTravellerIds((current) => {
      if (current.includes(travellerId)) {
        return current.filter((id) => id !== travellerId);
      }
      return [...current, travellerId];
    });
  }, []);

  const onSend = useCallback(() => {
    // Submit API lands in a later pass — UI only for now.
  }, []);

  return (
    <View style={[styles.root, { gap: layout.sectionGap }]}>
      <View
        style={[
          styles.card,
          {
            borderRadius: layout.cardRadius,
            paddingHorizontal: layout.cardPad,
            paddingTop: layout.cardPad,
            paddingBottom: layout.cardPad,
            gap: layout.cardGap,
          },
        ]}
      >
        <RequestFormField
          label="WHERE"
          value={destination}
          onChangeText={setDestination}
          placeholder="Amalfi Coast"
          accessibilityLabel="Where"
        />
        <RequestFormField
          label="WHEN"
          value={dates}
          onChangeText={setDates}
          placeholder="14 – 20 February, or flexible"
          helperText="Approximate is fine."
          accessibilityLabel="When"
        />
        <RequestFormField
          label="BEDROOMS"
          value={bedrooms}
          onChangeText={setBedrooms}
          placeholder="Five, ideally with a pool"
          accessibilityLabel="Bedrooms"
        />
      </View>

      <View
        style={[
          styles.card,
          {
            borderRadius: layout.cardRadius,
            paddingHorizontal: layout.cardPad,
            paddingTop: layout.cardPad,
            paddingBottom: layout.cardPad,
          },
        ]}
      >
        <RequestFormField
          label="ANYTHING WE SHOULD KNOW?"
          value={additionalInformation}
          onChangeText={setAdditionalInformation}
          placeholder="Preferences, occasion, anything you are still deciding"
          multiline
          minHeight={110}
          accessibilityLabel="Anything we should know"
        />
      </View>

      <TravellersSelectionCard
        travellers={MOCK_REQUEST_TRAVELLERS}
        selectedIds={selectedTravellerIds}
        onToggleTraveller={onToggleTraveller}
      />

      <SendToGodwitButton onPress={onSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
