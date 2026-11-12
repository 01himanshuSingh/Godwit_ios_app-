/**
 * Flight request form — trip type, airports, dates, airline, cabin, guests → CRM.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { OptionSelectField } from '@/features/requests/components/OptionSelectField';
import { PlacesAutocompleteField } from '@/features/requests/components/PlacesAutocompleteField';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SegmentedTabs } from '@/features/requests/components/SegmentedTabs';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { TravellerCountCard } from '@/features/requests/components/TravellerCountCard';
import {
  CABIN_CLASS_OPTIONS,
  FLIGHT_TRIP_TYPE_OPTIONS,
  PREFERRED_AIRLINE_OPTIONS,
} from '@/features/requests/data/requestInventory';
import {
  mapFlightFormToAppRequest,
  type FlightTripType,
} from '@/features/requests/flight/mapFlightFormToAppRequest';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import {
  INITIAL_TRAVELLER_COUNTS,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';
import {
  firstFieldError,
  requireDateOnOrAfterToday,
  requireDistinctPlaces,
  requireEndOnOrAfterStart,
  requireText,
  requireTravellerParty,
  setError,
  type FieldErrors,
} from '@/features/requests/shared/validateRequestForm';
import { colors } from '@/ui/tokens/colors';

export function FlightRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [tripType, setTripType] = useState<FlightTripType>('round_trip');
  const [flyingFrom, setFlyingFrom] = useState('');
  const [fromPlaceId, setFromPlaceId] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState('');
  const [toPlaceId, setToPlaceId] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [preferredAirline, setPreferredAirline] = useState('');
  const [cabinClass, setCabinClass] = useState('Business');
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
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
    setError(nextErrors, 'departure', requireDateOnOrAfterToday(departure, 'Departure'));
    if (needsReturn) {
      setError(nextErrors, 'returnDate', requireDateOnOrAfterToday(returnDate, 'Return date'));
      setError(
        nextErrors,
        'returnDate',
        nextErrors.returnDate ||
          requireEndOnOrAfterStart(departure, returnDate, 'Return date', 'Departure'),
      );
    }
    setError(nextErrors, 'cabinClass', requireText(cabinClass, 'Cabin class', { minLength: 1 }));
    setError(nextErrors, 'counts', requireTravellerParty(counts));

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    void submitRequest(
      mapFlightFormToAppRequest({
        tripType,
        flyingFrom,
        fromPlaceId,
        flyingTo,
        toPlaceId,
        departure,
        returnDate: needsReturn ? returnDate : null,
        preferredAirline,
        cabinClass,
        counts,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [
    additionalInformation,
    cabinClass,
    counts,
    departure,
    flyingFrom,
    flyingTo,
    fromPlaceId,
    needsReturn,
    preferredAirline,
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
          options={FLIGHT_TRIP_TYPE_OPTIONS}
          value={tripType}
          onChange={(next) => {
            setTripType(next as FlightTripType);
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
          placeholder="London (LHR)"
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
          placeholder="Geneva (GVA)"
          placeType="airport"
        />

        <DateFieldPicker
          label="DEPARTURE"
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

        <OptionSelectField
          label="PREFERRED AIRLINE"
          options={PREFERRED_AIRLINE_OPTIONS}
          value={preferredAirline}
          onChange={setPreferredAirline}
          placeholder="From inventory"
          optional
        />

        <OptionSelectField
          label="CABIN CLASS"
          options={CABIN_CLASS_OPTIONS}
          value={cabinClass}
          error={errors.cabinClass}
          onChange={(next) => {
            setCabinClass(next);
            clearError('cabinClass');
          }}
          placeholder="Business"
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
