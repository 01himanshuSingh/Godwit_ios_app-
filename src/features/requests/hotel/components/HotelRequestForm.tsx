/**
 * Hotel request form — City, dates, preferred hotel, guests, rooms → CRM enquiry.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CityPlacesAutocomplete } from '@/features/requests/components/CityPlacesAutocomplete';
import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { OptionSelectField } from '@/features/requests/components/OptionSelectField';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { StepperFieldRow } from '@/features/requests/components/StepperFieldRow';
import { TravellerCountCard } from '@/features/requests/components/TravellerCountCard';
import { PREFERRED_HOTEL_OPTIONS } from '@/features/requests/data/requestInventory';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { mapHotelFormToAppRequest } from '@/features/requests/hotel/mapHotelFormToAppRequest';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import {
  INITIAL_TRAVELLER_COUNTS,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';
import {
  firstFieldError,
  requireDateOnOrAfterToday,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
  requireTravellerParty,
  setError,
  type FieldErrors,
} from '@/features/requests/shared/validateRequestForm';
import { colors } from '@/ui/tokens/colors';

export function HotelRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [city, setCity] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [preferredHotel, setPreferredHotel] = useState('');
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [roomCount, setRoomCount] = useState(1);
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
    setError(nextErrors, 'checkIn', requireDateOnOrAfterToday(checkIn, 'Check-in'));
    setError(nextErrors, 'checkOut', requireDateOnOrAfterToday(checkOut, 'Check-out'));
    setError(
      nextErrors,
      'checkOut',
      nextErrors.checkOut || requireEndOnOrAfterStart(checkIn, checkOut, 'Check-out', 'Check-in'),
    );
    setError(nextErrors, 'counts', requireTravellerParty(counts));
    setError(nextErrors, 'roomCount', requirePositiveCount(roomCount, 'Number of rooms'));

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    void submitRequest(
      mapHotelFormToAppRequest({
        city,
        placeId,
        checkIn,
        checkOut,
        preferredHotel,
        counts,
        roomCount,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [
    additionalInformation,
    checkIn,
    checkOut,
    city,
    counts,
    placeId,
    preferredHotel,
    roomCount,
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
        <CityPlacesAutocomplete
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
          placeholder="Courchevel"
        />

        <DateFieldPicker
          label="CHECK IN"
          value={checkIn}
          error={errors.checkIn}
          onChange={(next) => {
            setCheckIn(next);
            clearError('checkIn');
            if (next && checkOut && checkOut.getTime() < next.getTime()) {
              setCheckOut(null);
              clearError('checkOut');
            }
          }}
          placeholder="Select date"
          minimumDate={new Date()}
        />

        <DateFieldPicker
          label="CHECK OUT"
          value={checkOut}
          error={errors.checkOut}
          onChange={(next) => {
            setCheckOut(next);
            clearError('checkOut');
          }}
          placeholder="Select date"
          minimumDate={checkIn || new Date()}
        />

        <OptionSelectField
          label="PREFERRED HOTEL"
          options={PREFERRED_HOTEL_OPTIONS}
          value={preferredHotel}
          onChange={setPreferredHotel}
          placeholder="From inventory"
          optional
        />

        <StepperFieldRow
          label="NUMBER OF ROOMS"
          hint="How many rooms do you need?"
          value={roomCount}
          error={errors.roomCount}
          onChange={(next) => {
            setRoomCount(next);
            clearError('roomCount');
          }}
          min={1}
          max={20}
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
