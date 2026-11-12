/**
 * Yacht request form — destination, charter dates, duration, type, guests → CRM.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DateFieldPicker } from '@/features/requests/components/DateFieldPicker';
import { DateTimeFieldPicker } from '@/features/requests/components/DateTimeFieldPicker';
import { PlacesAutocompleteField } from '@/features/requests/components/PlacesAutocompleteField';
import { RequestFormField } from '@/features/requests/components/RequestFormField';
import { SegmentedTabs } from '@/features/requests/components/SegmentedTabs';
import { SendToGodwitButton } from '@/features/requests/components/SendToGodwitButton';
import { StepperFieldRow } from '@/features/requests/components/StepperFieldRow';
import { YACHT_CHARTER_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { requestFormLayoutForWidth } from '@/features/requests/shared/requestFormLayout';
import {
  firstFieldError,
  requireDate,
  requireDateOnOrAfterToday,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
  setError,
  type FieldErrors,
} from '@/features/requests/shared/validateRequestForm';
import { mapYachtFormToAppRequest } from '@/features/requests/yacht/mapYachtFormToAppRequest';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function YachtRequestForm() {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => requestFormLayoutForWidth(width), [width]);
  const { submitting, submitRequest } = useSubmitServiceRequest();

  const [destination, setDestination] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [charterStart, setCharterStart] = useState<Date | null>(null);
  const [charterEnd, setCharterEnd] = useState<Date | null>(null);
  const [duration, setDuration] = useState<Date | null>(null);
  const [durationFlexible, setDurationFlexible] = useState(true);
  const [charterType, setCharterType] = useState('private');
  const [guests, setGuests] = useState(6);
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
    setError(nextErrors, 'destination', requireText(destination, 'Destination'));
    setError(nextErrors, 'charterStart', requireDateOnOrAfterToday(charterStart, 'Charter start'));
    setError(nextErrors, 'charterEnd', requireDateOnOrAfterToday(charterEnd, 'Charter end'));
    setError(
      nextErrors,
      'charterEnd',
      nextErrors.charterEnd ||
        requireEndOnOrAfterStart(charterStart, charterEnd, 'Charter end', 'Charter start'),
    );
    if (!durationFlexible) {
      setError(nextErrors, 'duration', requireDate(duration, 'Duration'));
    }
    setError(
      nextErrors,
      'charterType',
      requireText(
        YACHT_CHARTER_TYPE_OPTIONS.find((option) => option.id === charterType)?.label ||
          charterType,
        'Charter type',
        { minLength: 1 },
      ),
    );
    setError(nextErrors, 'guests', requirePositiveCount(guests, 'Guests'));

    setErrors(nextErrors);
    const first = firstFieldError(nextErrors);
    if (first) {
      Alert.alert('Missing details', first);
      return;
    }

    const charterTypeLabel =
      YACHT_CHARTER_TYPE_OPTIONS.find((option) => option.id === charterType)?.label || charterType;

    void submitRequest(
      mapYachtFormToAppRequest({
        destination,
        placeId,
        charterStart,
        charterEnd,
        duration,
        durationFlexible,
        charterType: charterTypeLabel,
        guests,
        notes: additionalInformation,
        travellerIds: [],
        travellers: [],
      }),
    );
  }, [
    additionalInformation,
    charterEnd,
    charterStart,
    charterType,
    destination,
    duration,
    durationFlexible,
    guests,
    placeId,
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
          label="DESTINATION"
          value={destination}
          error={errors.destination}
          onChangeText={(text) => {
            setDestination(text);
            setPlaceId(null);
            clearError('destination');
          }}
          onSelectPlace={(place) => {
            setDestination(place.description || place.mainText);
            setPlaceId(place.placeId);
            clearError('destination');
          }}
          placeholder="Amalfi and Capri"
          placeType="geocode"
        />

        <DateFieldPicker
          label="CHARTER START"
          value={charterStart}
          error={errors.charterStart}
          onChange={(next) => {
            setCharterStart(next);
            clearError('charterStart');
            if (next && charterEnd && charterEnd.getTime() < next.getTime()) {
              setCharterEnd(null);
              clearError('charterEnd');
            }
          }}
          placeholder="Select date"
          minimumDate={new Date()}
        />

        <DateFieldPicker
          label="CHARTER END"
          value={charterEnd}
          error={errors.charterEnd}
          onChange={(next) => {
            setCharterEnd(next);
            clearError('charterEnd');
          }}
          placeholder="Select date"
          minimumDate={charterStart || new Date()}
        />

        <View style={styles.durationBlock}>
          <DateTimeFieldPicker
            label="DURATION"
            value={durationFlexible ? null : duration}
            error={errors.duration}
            onChange={(next) => {
              setDurationFlexible(false);
              setDuration(next);
              clearError('duration');
            }}
            placeholder="10:00 AM"
            mode="time"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: durationFlexible }}
            onPress={() => {
              setDurationFlexible(true);
              clearError('duration');
            }}
            style={[styles.flexibleChip, durationFlexible && styles.flexibleChipSelected]}
          >
            <Text style={[styles.flexibleLabel, durationFlexible && styles.flexibleLabelSelected]}>
              Flexible
            </Text>
          </Pressable>
        </View>

        <SegmentedTabs
          label="CHARTER TYPE"
          options={YACHT_CHARTER_TYPE_OPTIONS}
          value={charterType}
          onChange={(next) => {
            setCharterType(next);
            clearError('charterType');
          }}
        />

        <StepperFieldRow
          label="GUESTS"
          hint="How many guests?"
          value={guests}
          error={errors.guests}
          onChange={(next) => {
            setGuests(next);
            clearError('guests');
          }}
          min={1}
          max={50}
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
  durationBlock: {
    gap: 10,
  },
  flexibleChip: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  flexibleChipSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F4F7F1',
  },
  flexibleLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.forest,
  },
  flexibleLabelSelected: {
    color: colors.accent,
  },
});
