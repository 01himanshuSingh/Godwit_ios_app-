/**
 * Private jet request form — trip type, airports, dates, passengers → CRM.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { PlacesAutocompleteField } from '@/features/requests/components/PlacesAutocompleteField';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SegmentedTabs } from '@/features/requests/components/SegmentedTabs';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { StepperFieldRow } from '@/features/requests/components/StepperFieldRow';
import { PRIVATE_JET_TRIP_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import {
  mapPrivateJetFormToAppRequest,
  type PrivateJetTripType,
} from '@/features/requests/private-jet/mapPrivateJetFormToAppRequest';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import {
  firstFieldError,
  requireDateOnOrAfterToday,
  requireDistinctPlaces,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
  setError,
  type FieldErrors,
} from '@/features/requests/shared/validateRequestForm';
import { colors } from '@/ui/tokens/colors';

export function PrivateJetRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [tripType, setTripType] = useState<PrivateJetTripType>('one_way');
  const [flyingFrom, setFlyingFrom] = useState('');
  const [fromPlaceId, setFromPlaceId] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState('');
  const [toPlaceId, setToPlaceId] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(4);
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const needsReturn = tripType !== 'one_way';

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
    setError(nextErrors, 'flyingFrom', requireText(flyingFrom, 'Flying from'));
    setError(nextErrors, 'flyingTo', requireText(flyingTo, 'Flying to'));
    setError(
      nextErrors,
      'flyingTo',
      nextErrors.flyingTo || requireDistinctPlaces(flyingFrom, flyingTo),
    );
    setError(nextErrors, 'departure', requireDateOnOrAfterToday(departure, 'Departure date'));
    if (needsReturn) {
      setError(nextErrors, 'returnDate', requireDateOnOrAfterToday(returnDate, 'Return date'));
      setError(
        nextErrors,
        'returnDate',
        nextErrors.returnDate ||
          requireEndOnOrAfterStart(departure, returnDate, 'Return date', 'Departure date'),
      );
    }
    setError(nextErrors, 'passengers', requirePositiveCount(passengers, 'Passengers'));

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    void submitRequest(
      mapPrivateJetFormToAppRequest({
        tripType,
        flyingFrom,
        fromPlaceId,
        flyingTo,
        toPlaceId,
        departure,
        returnDate: needsReturn ? returnDate : null,
        passengers,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [
    additionalInformation,
    departure,
    flyingFrom,
    flyingTo,
    fromPlaceId,
    needsReturn,
    passengers,
    returnDate,
    submitRequest,
    toPlaceId,
    tripType,
  ]);

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
        <SegmentedTabs
          label="TRIP TYPE"
          options={PRIVATE_JET_TRIP_TYPE_OPTIONS}
          value={tripType}
          onChange={(next) => {
            setTripType(next as PrivateJetTripType);
            if (next === 'one_way') {
              setReturnDate(null);
              clearError('returnDate');
            }
          }}
        />

        <PlacesAutocompleteField
          label="FLYING FROM"
          value={flyingFrom}
          error={errors.flyingFrom}
          onChangeText={(text) => {
            setFlyingFrom(text);
            setFromPlaceId(null);
            clearError('flyingFrom');
            clearError('flyingTo');
          }}
          onSelectPlace={(place) => {
            setFlyingFrom(place.description || place.mainText);
            setFromPlaceId(place.placeId);
            clearError('flyingFrom');
            clearError('flyingTo');
          }}
          placeholder="Farnborough"
          placeType="airport"
        />

        <PlacesAutocompleteField
          label="FLYING TO"
          value={flyingTo}
          error={errors.flyingTo}
          onChangeText={(text) => {
            setFlyingTo(text);
            setToPlaceId(null);
            clearError('flyingTo');
          }}
          onSelectPlace={(place) => {
            setFlyingTo(place.description || place.mainText);
            setToPlaceId(place.placeId);
            clearError('flyingTo');
          }}
          placeholder="Sion Airport (SIR)"
          placeType="airport"
        />

        <DateFieldPicker
          label="DEPARTURE DATE"
          value={departure}
          error={errors.departure}
          onChange={(next) => {
            setDeparture(next);
            clearError('departure');
            if (next && returnDate && returnDate.getTime() < next.getTime()) {
              setReturnDate(null);
              clearError('returnDate');
            }
          }}
          placeholder="Select date"
          minimumDate={new Date()}
        />

        {needsReturn ? (
          <DateFieldPicker
            label="RETURN DATE"
            value={returnDate}
            error={errors.returnDate}
            onChange={(next) => {
              setReturnDate(next);
              clearError('returnDate');
            }}
            placeholder="Select date"
            minimumDate={departure || new Date()}
          />
        ) : null}

        <StepperFieldRow
          label="PASSENGERS"
          hint="How many people will fly?"
          value={passengers}
          error={errors.passengers}
          onChange={(next) => {
            setPassengers(next);
            clearError('passengers');
          }}
          min={1}
          max={20}
        />
      </View>

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
          onChangeText={setAdditionalInformation}
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
