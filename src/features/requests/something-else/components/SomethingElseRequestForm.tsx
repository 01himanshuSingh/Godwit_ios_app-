/**
 * Something else request form — city, when, guests, notes → CRM.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CityPlacesAutocomplete } from '@/features/requests/components/CityPlacesAutocomplete';
import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { TravellerCountCard } from '@/features/requests/components/TravellerCountCard';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import {
  INITIAL_TRAVELLER_COUNTS,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';
import {
  firstFieldError,
  requireDateOnOrAfterToday,
  requireEndOnOrAfterStart,
  requireText,
  requireTravellerParty,
  setError,
  type FieldErrors,
} from '@/features/requests/shared/validateRequestForm';
import { mapSomethingElseFormToAppRequest } from '@/features/requests/something-else/mapSomethingElseFormToAppRequest';
import { colors } from '@/ui/tokens/colors';

export function SomethingElseRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [city, setCity] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [whenStart, setWhenStart] = useState<Date | null>(null);
  const [whenEnd, setWhenEnd] = useState<Date | null>(null);
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const onSend = useCallback(() => {
    const nextErrors: FieldErrors = {};
    setError(nextErrors, 'city', requireText(city, 'City'));
    setError(nextErrors, 'whenStart', requireDateOnOrAfterToday(whenStart, 'When — from'));
    if (whenEnd) {
      setError(
        nextErrors,
        'whenEnd',
        requireEndOnOrAfterStart(whenStart, whenEnd, 'When — until', 'When — from'),
      );
    }
    setError(nextErrors, 'counts', requireTravellerParty(counts));
    setError(
      nextErrors,
      'notes',
      requireText(additionalInformation, 'Anything we should know', { minLength: 3 }),
    );

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    void submitRequest(
      mapSomethingElseFormToAppRequest({
        city,
        placeId,
        whenStart,
        whenEnd: whenEnd || whenStart,
        counts,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [additionalInformation, city, counts, placeId, submitRequest, whenEnd, whenStart]);

  return (
    <View style={[styles.root, { gap: layout.sectionGap }]}>
      <View
        style={[
          styles.card,
          {
            borderRadius: layout.cardRadius,
            paddingHorizontal: layout.cardPadH,
            paddingTop: layout.cardPadV,
            paddingBottom: layout.cardPadV,
            shadowOpacity: layout.shadowOpacity,
            shadowRadius: layout.shadowRadius,
            gap: layout.cardGap,
          },
        ]}
      >
        <CityPlacesAutocomplete
          label="CITY"
          value={city}
          error={errors.city}
          onChangeText={(text) => {
            setCity(text);
            setPlaceId(null);
            clearError('city');
          }}
          onSelectPlace={(place) => {
            setCity(place.mainText || place.description);
            setPlaceId(place.placeId);
            clearError('city');
          }}
          placeholder="Kyoto"
        />

        <DateFieldPicker
          label="WHEN — FROM"
          value={whenStart}
          error={errors.whenStart}
          onChange={(next) => {
            setWhenStart(next);
            clearError('whenStart');
            if (next && whenEnd && whenEnd.getTime() < next.getTime()) {
              setWhenEnd(null);
              clearError('whenEnd');
            }
          }}
          placeholder="Select date"
          minimumDate={new Date()}
        />

        <DateFieldPicker
          label="WHEN — UNTIL"
          value={whenEnd}
          error={errors.whenEnd}
          onChange={(next) => {
            setWhenEnd(next);
            clearError('whenEnd');
          }}
          placeholder="Optional end date"
          minimumDate={whenStart || new Date()}
        />
      </View>

      <TravellerCountCard
        counts={counts}
        error={errors.counts}
        onChange={(next) => {
          setCounts(next);
          clearError('counts');
        }}
      />

      <View
        style={[
          styles.card,
          {
            borderRadius: layout.cardRadius,
            paddingHorizontal: layout.cardPadH,
            paddingTop: layout.cardPadV,
            paddingBottom: layout.cardPadV,
            shadowOpacity: layout.shadowOpacity,
            shadowRadius: layout.shadowRadius,
          },
        ]}
      >
        <RequestFormField
          label="ANYTHING WE SHOULD KNOW?"
          value={additionalInformation}
          error={errors.notes}
          onChangeText={(text) => {
            setAdditionalInformation(text);
            clearError('notes');
          }}
          placeholder="Preferences, occasions…"
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
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
