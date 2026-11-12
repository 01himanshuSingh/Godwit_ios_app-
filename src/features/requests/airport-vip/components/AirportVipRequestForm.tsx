/**
 * Airport VIP request form — airport, dates, CRM service type, guests → CRM.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { mapAirportVipFormToAppRequest } from '@/features/requests/airport-vip/mapAirportVipFormToAppRequest';
import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { OptionSelectField } from '@/features/requests/components/OptionSelectField';
import { PlacesAutocompleteField } from '@/features/requests/components/PlacesAutocompleteField';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { TravellerCountCard } from '@/features/requests/components/TravellerCountCard';
import { AIRPORT_VIP_SERVICE_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
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
import { colors } from '@/ui/tokens/colors';

export function AirportVipRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [airport, setAirport] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [serviceStart, setServiceStart] = useState<Date | null>(null);
  const [serviceEnd, setServiceEnd] = useState<Date | null>(null);
  const [serviceType, setServiceType] = useState('Arrival');
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
    setError(nextErrors, 'airport', requireText(airport, 'Airport'));
    setError(nextErrors, 'serviceStart', requireDateOnOrAfterToday(serviceStart, 'Service start'));
    if (serviceEnd) {
      setError(
        nextErrors,
        'serviceEnd',
        requireEndOnOrAfterStart(serviceStart, serviceEnd, 'Service end', 'Service start'),
      );
    }
    setError(nextErrors, 'serviceType', requireText(serviceType, 'Service type', { minLength: 1 }));
    setError(nextErrors, 'counts', requireTravellerParty(counts));

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    void submitRequest(
      mapAirportVipFormToAppRequest({
        airport,
        placeId,
        serviceStart,
        serviceEnd: serviceEnd || serviceStart,
        serviceType,
        counts,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [
    additionalInformation,
    airport,
    counts,
    placeId,
    serviceEnd,
    serviceStart,
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
            paddingHorizontal: layout.cardPadH,
            paddingTop: layout.cardPadV,
            paddingBottom: layout.cardPadV,
            shadowOpacity: layout.shadowOpacity,
            shadowRadius: layout.shadowRadius,
            gap: layout.cardGap,
          },
        ]}
      >
        <PlacesAutocompleteField
          label="AIRPORT"
          value={airport}
          error={errors.airport}
          onChangeText={(text) => {
            setAirport(text);
            setPlaceId(null);
            clearError('airport');
          }}
          onSelectPlace={(place) => {
            setAirport(place.description || place.mainText);
            setPlaceId(place.placeId);
            clearError('airport');
          }}
          placeholder="Dubai International"
          placeType="airport"
        />

        <DateFieldPicker
          label="SERVICE START"
          value={serviceStart}
          error={errors.serviceStart}
          onChange={(next) => {
            setServiceStart(next);
            clearError('serviceStart');
            if (next && serviceEnd && serviceEnd.getTime() < next.getTime()) {
              setServiceEnd(null);
              clearError('serviceEnd');
            }
          }}
          placeholder="Select date"
          minimumDate={new Date()}
        />

        <DateFieldPicker
          label="SERVICE END"
          value={serviceEnd}
          error={errors.serviceEnd}
          onChange={(next) => {
            setServiceEnd(next);
            clearError('serviceEnd');
          }}
          placeholder="Optional end date"
          minimumDate={serviceStart || new Date()}
        />

        <OptionSelectField
          label="SERVICE TYPE"
          options={AIRPORT_VIP_SERVICE_TYPE_OPTIONS}
          value={serviceType}
          error={errors.serviceType}
          onChange={(next) => {
            setServiceType(next);
            clearError('serviceType');
          }}
          placeholder="Arrival"
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
