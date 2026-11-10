/**
 * Chauffeur request form — city, service type, pick-up/drop-off, datetimes → CRM.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { DateTimeFieldPicker } from '@/features/requests/components/DateTimeFieldPicker';
import { OptionSelectField } from '@/features/requests/components/OptionSelectField';
import { PlacesAutocompleteField } from '@/features/requests/components/PlacesAutocompleteField';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { StepperFieldRow } from '@/features/requests/components/StepperFieldRow';
import { CHAUFFEUR_SERVICE_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
import { mapChauffeurFormToAppRequest } from '@/features/requests/chauffeur/mapChauffeurFormToAppRequest';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import {
  firstFieldError,
  requireDateTimeOnOrAfterNow,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
  setError,
  type FieldErrors,
} from '@/features/requests/shared/validateRequestForm';
import { colors } from '@/ui/tokens/colors';

function needsDropOff(serviceType: string): boolean {
  const normalized = serviceType.trim().toLowerCase();
  // Match CRM Instant Sale: airport arrival/departure need both ends of the trip.
  return normalized.includes('airport');
}

export function ChauffeurRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [city, setCity] = useState('');
  const [cityPlaceId, setCityPlaceId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState('Airport Arrival');
  const [pickUp, setPickUp] = useState('');
  const [pickUpPlaceId, setPickUpPlaceId] = useState<string | null>(null);
  const [dropOff, setDropOff] = useState('');
  const [dropOffPlaceId, setDropOffPlaceId] = useState<string | null>(null);
  const [pickUpAt, setPickUpAt] = useState<Date | null>(null);
  const [returnAt, setReturnAt] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(4);
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
    setError(nextErrors, 'serviceType', requireText(serviceType, 'Service type', { minLength: 1 }));
    setError(nextErrors, 'pickUp', requireText(pickUp, 'Pick-up'));
    if (needsDropOff(serviceType)) {
      setError(nextErrors, 'dropOff', requireText(dropOff, 'Drop-off location'));
    }
    setError(nextErrors, 'pickUpAt', requireDateTimeOnOrAfterNow(pickUpAt, 'Pick-up date & time'));
    if (returnAt) {
      setError(
        nextErrors,
        'returnAt',
        requireEndOnOrAfterStart(pickUpAt, returnAt, 'Return date & time', 'Pick-up date & time'),
      );
    }
    setError(nextErrors, 'passengers', requirePositiveCount(passengers, 'Number of passengers'));

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    void submitRequest(
      mapChauffeurFormToAppRequest({
        city,
        cityPlaceId,
        serviceType,
        pickUp,
        pickUpPlaceId,
        dropOff,
        dropOffPlaceId,
        pickUpAt,
        returnAt,
        passengers,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [
    additionalInformation,
    city,
    cityPlaceId,
    dropOff,
    dropOffPlaceId,
    passengers,
    pickUp,
    pickUpAt,
    pickUpPlaceId,
    returnAt,
    serviceType,
    submitRequest,
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
        <PlacesAutocompleteField
          label="CITY"
          value={city}
          error={errors.city}
          onChangeText={(text) => {
            setCity(text);
            setCityPlaceId(null);
            clearError('city');
          }}
          onSelectPlace={(place) => {
            setCity(place.mainText || place.description);
            setCityPlaceId(place.placeId);
            clearError('city');
          }}
          placeholder="Paris"
          placeType="cities"
        />

        <OptionSelectField
          label="SERVICE TYPE"
          options={CHAUFFEUR_SERVICE_TYPE_OPTIONS}
          value={serviceType}
          error={errors.serviceType}
          onChange={(next) => {
            setServiceType(next);
            clearError('serviceType');
            clearError('dropOff');
          }}
          placeholder="Airport Arrival"
        />

        <PlacesAutocompleteField
          label="PICK-UP"
          value={pickUp}
          error={errors.pickUp}
          onChangeText={(text) => {
            setPickUp(text);
            setPickUpPlaceId(null);
            clearError('pickUp');
          }}
          onSelectPlace={(place) => {
            setPickUp(place.description || place.mainText);
            setPickUpPlaceId(place.placeId);
            clearError('pickUp');
          }}
          placeholder="Le Bourget"
          placeType="geocode"
        />

        <PlacesAutocompleteField
          label="DROP-OFF LOCATION"
          value={dropOff}
          error={errors.dropOff}
          onChangeText={(text) => {
            setDropOff(text);
            setDropOffPlaceId(null);
            clearError('dropOff');
          }}
          onSelectPlace={(place) => {
            setDropOff(place.description || place.mainText);
            setDropOffPlaceId(place.placeId);
            clearError('dropOff');
          }}
          placeholder="Location"
          placeType="geocode"
          helperText={
            needsDropOff(serviceType)
              ? 'Required for airport arrival / departure.'
              : 'Optional for disposal / self drive. Pick a suggestion or type your own.'
          }
        />

        <DateTimeFieldPicker
          label="PICK-UP DATE & TIME"
          value={pickUpAt}
          error={errors.pickUpAt}
          onChange={(next) => {
            setPickUpAt(next);
            clearError('pickUpAt');
            if (next && returnAt && returnAt.getTime() < next.getTime()) {
              setReturnAt(null);
              clearError('returnAt');
            }
          }}
          placeholder="Select date & time"
          mode="datetime"
          minimumDate={new Date()}
        />

        <DateTimeFieldPicker
          label="RETURN DATE & TIME"
          value={returnAt}
          error={errors.returnAt}
          onChange={(next) => {
            setReturnAt(next);
            clearError('returnAt');
          }}
          placeholder="Optional"
          mode="datetime"
          minimumDate={pickUpAt || new Date()}
        />

        <StepperFieldRow
          label="NUMBER OF PASSENGERS"
          hint="How many passengers?"
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
