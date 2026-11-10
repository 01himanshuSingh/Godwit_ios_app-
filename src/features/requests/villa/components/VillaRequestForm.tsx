/**
 * Villa request form — maps to CRM enquiry via universal writer.
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { TravellersSelectionCard } from '@/features/requests/components/TravellersSelectionCard';
import { useRequestTravellers } from '@/features/requests/hooks/useRequestTravellers';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

function layoutForWidth(width: number) {
  if (width < 360) {
    return { cardPad: 16, cardRadius: 16, cardGap: 18, sectionGap: 14 };
  }
  return { cardPad: 20, cardRadius: 18, cardGap: 22, sectionGap: 16 };
}

export function VillaRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const { travellers, isLoading: travellersLoading, errorMessage } = useRequestTravellers();
  const { submitting, submit } = useSubmitServiceRequest();

  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [selectedTravellerIds, setSelectedTravellerIds] = useState<string[]>([]);

  const onToggleTraveller = useCallback((travellerId: string) => {
    setSelectedTravellerIds((current) =>
      current.includes(travellerId)
        ? current.filter((id) => id !== travellerId)
        : [...current, travellerId],
    );
  }, []);

  const onSend = useCallback(() => {
    void submit({
      category: 'villa',
      main: destination,
      when: dates,
      extra: bedrooms,
      notes: additionalInformation,
      travellerIds: selectedTravellerIds,
      travellers: travellers.filter((t) => selectedTravellerIds.includes(t.id)),
    });
  }, [
    additionalInformation,
    bedrooms,
    dates,
    destination,
    selectedTravellerIds,
    submit,
    travellers,
  ]);

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
          placeholder="Ibiza"
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
          placeholder="4 bedrooms"
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
          placeholder="Staff, pool, privacy — anything else…"
          multiline
          minHeight={110}
          accessibilityLabel="Anything we should know"
        />
      </View>

      <TravellersSelectionCard
        travellers={travellers}
        selectedIds={selectedTravellerIds}
        onToggleTraveller={onToggleTraveller}
      />
      {travellersLoading ? (
        <Text style={styles.meta}>Loading travellers…</Text>
      ) : errorMessage ? (
        <Text style={styles.metaError}>{errorMessage}</Text>
      ) : travellers.length === 0 ? (
        <Text style={styles.meta}>No travellers on this account yet.</Text>
      ) : null}

      <SendToGodwitButton onPress={onSend} loading={submitting} disabled={travellersLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
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
  meta: { fontFamily: fontFamily.manrope.regular, fontSize: 13, color: colors.muted },
  metaError: { fontFamily: fontFamily.manrope.regular, fontSize: 13, color: '#8B4A3F' },
});
