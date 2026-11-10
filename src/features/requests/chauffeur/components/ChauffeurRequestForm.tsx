/**
 * Chauffeur request form — maps to CRM enquiry via universal writer.
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { colors } from '@/ui/tokens/colors';

function layoutForWidth(width: number) {
  if (width < 360) {
    return { cardPad: 16, cardRadius: 16, cardGap: 18, sectionGap: 14 };
  }
  return { cardPad: 20, cardRadius: 18, cardGap: 22, sectionGap: 16 };
}

export function ChauffeurRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const { submitting, submit } = useSubmitServiceRequest();

  const [city, setCity] = useState('');
  const [dates, setDates] = useState('');
  const [pickUp, setPickUp] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');

  const onSend = useCallback(() => {
    void submit({
      category: 'car_chauffeur',
      main: city,
      when: dates,
      extra: pickUp,
      notes: additionalInformation,
      travellerIds: [],
      travellers: [],
    });
  }, [additionalInformation, city, dates, pickUp, submit]);

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
          label="CITY"
          value={city}
          onChangeText={setCity}
          placeholder="London"
          accessibilityLabel="City"
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
          label="PICK-UP"
          value={pickUp}
          onChangeText={setPickUp}
          placeholder="Hotel → Airport"
          accessibilityLabel="Pick-up"
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
          placeholder="Vehicle type, child seats, anything else…"
          multiline
          minHeight={110}
          accessibilityLabel="Anything we should know"
        />
      </View>

      <SendToGodwitButton onPress={onSend} loading={submitting} />
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
});
