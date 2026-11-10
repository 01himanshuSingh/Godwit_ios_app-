/**
 * Hotel request form — City (Places), check-in/out, guest counts, rooms → CRM enquiry.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CityPlacesAutocomplete } from '@/features/requests/components/CityPlacesAutocomplete';
import { CountStepper } from '@/features/requests/components/CountStepper';
import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { TravellerCountCard } from '@/features/requests/components/TravellerCountCard';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import {
  mapHotelFormToAppRequest,
  type HotelTravellerCounts,
} from '@/features/requests/hotel/mapHotelFormToAppRequest';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

function layoutForWidth(width: number) {
  if (width < 360) {
    return { cardPad: 16, cardRadius: 16, cardGap: 18, sectionGap: 14 };
  }
  return { cardPad: 20, cardRadius: 18, cardGap: 22, sectionGap: 16 };
}

const INITIAL_COUNTS: HotelTravellerCounts = {
  adults: 2,
  children: 0,
  infants: 0,
};

export function HotelRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [city, setCity] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [counts, setCounts] = useState<HotelTravellerCounts>(INITIAL_COUNTS);
  const [roomCount, setRoomCount] = useState(1);
  const [additionalInformation, setAdditionalInformation] = useState('');

  const onSend = useCallback(() => {
    if (!city.trim()) {
      Alert.alert('City required', 'Please choose a destination city.');
      return;
    }
    if (!checkIn || !checkOut) {
      Alert.alert('Dates required', 'Please select check-in and check-out dates.');
      return;
    }
    if (checkOut.getTime() < checkIn.getTime()) {
      Alert.alert('Invalid dates', 'Check-out must be on or after check-in.');
      return;
    }
    if (counts.adults + counts.children + counts.infants < 1) {
      Alert.alert('Guests required', 'Please add at least one adult, child, or infant.');
      return;
    }
    if (roomCount < 1) {
      Alert.alert('Rooms required', 'Please select at least one room.');
      return;
    }

    void submitRequest(
      mapHotelFormToAppRequest({
        city,
        placeId,
        checkIn,
        checkOut,
        counts,
        roomCount,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [additionalInformation, checkIn, checkOut, city, counts, placeId, roomCount, submitRequest]);

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
        <CityPlacesAutocomplete
          value={city}
          onChangeText={(text) => {
            setCity(text);
            setPlaceId(null);
          }}
          onSelectPlace={(place) => {
            setCity(place.mainText || place.description);
            setPlaceId(place.placeId);
          }}
          placeholder="Courchevel"
        />

        <DateFieldPicker
          label="CHECK IN"
          value={checkIn}
          onChange={(next) => {
            setCheckIn(next);
            if (next && checkOut && checkOut.getTime() < next.getTime()) {
              setCheckOut(null);
            }
          }}
          placeholder="Select date"
          minimumDate={new Date()}
        />

        <DateFieldPicker
          label="CHECK OUT"
          value={checkOut}
          onChange={setCheckOut}
          placeholder="Select date"
          minimumDate={checkIn || new Date()}
        />

        <View style={styles.roomsRow}>
          <View style={styles.roomsCopy}>
            <Text style={styles.roomsLabel}>NUMBER OF ROOMS</Text>
            <Text style={styles.roomsHint}>How many rooms do you need?</Text>
          </View>
          <CountStepper
            value={roomCount}
            onChange={setRoomCount}
            min={1}
            max={20}
            accessibilityLabel="Number of rooms"
          />
        </View>
      </View>

      <TravellerCountCard counts={counts} onChange={setCounts} />

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
  roomsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roomsCopy: {
    flex: 1,
    gap: 4,
  },
  roomsLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  roomsHint: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
