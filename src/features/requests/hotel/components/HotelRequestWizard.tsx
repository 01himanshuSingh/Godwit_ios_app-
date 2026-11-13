/**
 * Hotel New request — Stay · Travellers · Notes · Review wizard.
 */
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { mapHotelFormToAppRequest } from '@/features/requests/hotel/mapHotelFormToAppRequest';
import {
  ensureMinAdultParty,
  INITIAL_TRAVELLER_COUNTS,
  totalTravellers,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';
import {
  requireDateOnOrAfterToday,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
  requireTravellerParty,
} from '@/features/requests/shared/validateRequestForm';
import {
  ChipPill,
  CountFieldRow,
  FieldBlock,
  IconTapField,
  NotesTabContent,
  OptionalPill,
  ReviewTabContent,
  ScheduleField,
  TravellersTabContent,
  useWizardFieldStyles,
} from '@/features/requests/wizard/fields/WizardFields';
import { RequestSuccessView } from '@/features/requests/wizard/RequestSuccessView';
import { RequestWizardShell } from '@/features/requests/wizard/RequestWizardShell';
import { CitySearchSheet } from '@/features/requests/wizard/sheets/CitySearchSheet';
import { DateRangeSheet } from '@/features/requests/wizard/sheets/DateRangeSheet';
import { HotelPreferenceSheet } from '@/features/requests/wizard/sheets/HotelPreferenceSheet';
import { SummarySheet } from '@/features/requests/wizard/sheets/SummarySheet';
import type { WizardTabConfig, WizardTabId } from '@/features/requests/wizard/types';
import {
  getHotelBrandsQuickSelect,
  HOTEL_BRANDS_QUICK_SELECT_SIZE,
} from '@/lib/firebase/masterData';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const NOTE_CHIPS = [
  'Late check-in',
  'Ski-in/ski-out',
  'Adjoining rooms',
  'Anniversary',
  'Dietary needs',
  'Airport transfer',
] as const;

type HotelRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

function nightsLabel(checkIn: Date | null, checkOut: Date | null): string {
  if (!checkIn || !checkOut) return '';
  const n = differenceInCalendarDays(startOfDay(checkOut), startOfDay(checkIn));
  if (n <= 0) return '';
  return `${n} night${n === 1 ? '' : 's'}`;
}

export function HotelRequestWizard({ onBack, clearTabBar }: HotelRequestWizardProps) {
  const fieldStyles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [city, setCity] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [preferredHotel, setPreferredHotel] = useState('');
  const [preferredHotelBrandId, setPreferredHotelBrandId] = useState<string | null>(null);
  const [roomCount, setRoomCount] = useState(1);
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [cityOpen, setCityOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [hotelOpen, setHotelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Tabs marked complete only after a successful Continue (then show tick). */
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const quickBrandsQuery = useQuery({
    queryKey: ['masterData', 'hotelBrands', 'quickSelect', HOTEL_BRANDS_QUICK_SELECT_SIZE],
    queryFn: () => getHotelBrandsQuickSelect(HOTEL_BRANDS_QUICK_SELECT_SIZE),
    staleTime: 5 * 60 * 1000,
  });
  const quickBrands = quickBrandsQuery.data ?? [];
  const showQuickSelect = quickBrands.length > 0;

  const setPreferredBrand = useCallback((next: { name: string; brandId: string | null }) => {
    setPreferredHotel(next.name);
    setPreferredHotelBrandId(next.brandId);
  }, []);

  const tabs: WizardTabConfig[] = useMemo(
    () => [
      { id: 'details', label: 'Stay' },
      { id: 'travellers', label: 'Travellers' },
      { id: 'notes', label: 'Notes' },
      { id: 'review', label: 'Review' },
    ],
    [],
  );

  const stayValid = useMemo(() => {
    return (
      !requireText(city, 'City') &&
      !requireDateOnOrAfterToday(checkIn, 'Check-in') &&
      !requireDateOnOrAfterToday(checkOut, 'Check-out') &&
      !requireEndOnOrAfterStart(checkIn, checkOut, 'Check-out', 'Check-in') &&
      !requirePositiveCount(roomCount, 'Number of rooms')
    );
  }, [checkIn, checkOut, city, roomCount]);

  const travellersValid = useMemo(() => !requireTravellerParty(counts), [counts]);

  const completed = useMemo(
    () => ({
      details: Boolean(confirmed.details) && stayValid,
      travellers:
        Boolean(confirmed.details || confirmed.travellers) && stayValid && travellersValid,
      notes: Boolean(confirmed.notes),
      review: false,
    }),
    [confirmed.details, confirmed.notes, confirmed.travellers, stayValid, travellersValid],
  );

  // Review unlocks after Stay; Travellers + Notes are skippable.
  const disabledTabs = useMemo(
    () => ({
      review: !stayValid,
    }),
    [stayValid],
  );

  const nights = nightsLabel(checkIn, checkOut);
  const pax = totalTravellers(counts);

  const summaryPrimary =
    [city || null, nights || null].filter(Boolean).join(' · ') || 'Add stay details';
  const summarySecondary = [
    pax > 0
      ? `${pax} ${counts.adults === pax ? (pax === 1 ? 'adult' : 'adults') : pax === 1 ? 'traveller' : 'travellers'}`
      : null,
    preferredHotel || null,
  ]
    .filter(Boolean)
    .join(' · ');

  const summaryRows = useMemo(
    () => [
      { id: 'city', label: 'CITY', value: city, icon: 'pin' as const },
      {
        id: 'dates',
        label: 'DATES & STAY',
        value:
          checkIn && checkOut
            ? `${format(checkIn, 'd MMM')} – ${format(checkOut, 'd MMM yyyy')}${nights ? ` (${nights})` : ''}`
            : '',
        icon: 'calendar' as const,
      },
      {
        id: 'hotel',
        label: 'PREFERRED HOTEL',
        value: preferredHotel || 'No preference',
        icon: 'star' as const,
      },
      {
        id: 'rooms',
        label: 'ROOMS',
        value: `${roomCount} room${roomCount === 1 ? '' : 's'}`,
        icon: 'door' as const,
      },
      {
        id: 'travellers',
        label: 'TRAVELLERS',
        value: `${pax} traveller${pax === 1 ? '' : 's'} (${counts.adults} Adults${
          counts.children ? `, ${counts.children} Child` : ''
        }${counts.infants ? `, ${counts.infants} Infant` : ''})`,
        icon: 'people' as const,
      },
      {
        id: 'notes',
        label: 'SPECIAL REQUESTS',
        value: [notes.trim(), ...chips].filter(Boolean).join(', '),
        icon: 'note' as const,
      },
    ],
    [checkIn, checkOut, chips, city, counts, nights, notes, pax, preferredHotel, roomCount],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    stayValid,
  ].filter(Boolean).length;

  const validateStay = useCallback(() => {
    const next: Record<string, string> = {};
    const cityErr = requireText(city, 'City');
    const inErr = requireDateOnOrAfterToday(checkIn, 'Check-in');
    const outErr =
      requireDateOnOrAfterToday(checkOut, 'Check-out') ||
      requireEndOnOrAfterStart(checkIn, checkOut, 'Check-out', 'Check-in');
    const roomsErr = requirePositiveCount(roomCount, 'Number of rooms');
    if (cityErr) next.city = cityErr;
    if (inErr) next.checkIn = inErr;
    if (outErr) next.checkOut = outErr;
    if (roomsErr) next.roomCount = roomsErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [checkIn, checkOut, city, roomCount]);

  /** Skippable — if cleared, restore one adult. */
  const acceptTravellers = useCallback(() => {
    const nextCounts = ensureMinAdultParty(counts);
    if (nextCounts !== counts) setCounts(nextCounts);
    setErrors((prev) => {
      if (!prev.counts) return prev;
      const { counts: _ignored, ...rest } = prev;
      return rest;
    });
    setConfirmed((prev) => ({ ...prev, travellers: true }));
    return nextCounts;
  }, [counts]);

  const onContinue = useCallback(async () => {
    if (tab === 'details') {
      if (!validateStay()) return;
      setConfirmed((prev) => ({ ...prev, details: true, travellers: true }));
      setTab('travellers');
      return;
    }
    if (tab === 'travellers') {
      acceptTravellers();
      setTab('notes');
      return;
    }
    if (tab === 'notes') {
      // Notes are optional — empty is fine.
      setConfirmed((prev) => ({ ...prev, notes: true, travellers: true }));
      setTab('review');
      return;
    }

    const party = ensureMinAdultParty(counts);
    if (party !== counts) setCounts(party);
    setConfirmed((prev) => ({ ...prev, travellers: true, notes: true }));

    const noteParts = [notes.trim(), ...chips].filter(Boolean);
    const result = await submitRequest(
      mapHotelFormToAppRequest({
        city,
        placeId,
        checkIn,
        checkOut,
        preferredHotel,
        preferredHotelBrandId,
        counts: party,
        roomCount,
        notes: noteParts.join('. '),
        travellerIds: [],
        travellers: [],
      }),
      { suppressSuccessAlert: true },
    );
    if (result.ok) {
      setSuccessId(result.requestId ?? `GW-${Date.now().toString().slice(-6)}`);
    }
  }, [
    acceptTravellers,
    checkIn,
    checkOut,
    chips,
    city,
    counts,
    notes,
    placeId,
    preferredHotel,
    preferredHotelBrandId,
    roomCount,
    submitRequest,
    tab,
    validateStay,
  ]);

  const toggleChip = (chip: string) => {
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  };

  if (successId) {
    return (
      <RequestSuccessView referenceId={successId} onViewRequest={onBack} onNewRequest={onBack} />
    );
  }

  return (
    <>
      <RequestWizardShell
        title="Hotel"
        onBack={onBack}
        tabs={tabs}
        activeTab={tab}
        completed={completed}
        disabledTabs={disabledTabs}
        onChangeTab={setTab}
        summaryPrimary={summaryPrimary}
        summarySecondary={summarySecondary || undefined}
        ctaLabel={tab === 'review' ? 'Send to Godwit' : 'Continue'}
        ctaLoading={submitting}
        onPressSummary={() => setSummaryOpen(true)}
        onPressCta={() => void onContinue()}
        clearTabBar={clearTabBar}
      >
        {tab === 'details' ? (
          <View style={fieldStyles.stack}>
            <FieldBlock
              label="CITY"
              tag="REQUIRED"
              error={errors.city}
              helper="Places autocomplete, search destination"
            >
              <IconTapField
                icon="map-pin"
                value={city}
                placeholder="Courchevel"
                onPress={() => setCityOpen(true)}
                onClear={() => {
                  setCity('');
                  setPlaceId(null);
                }}
                clearAccessibilityLabel="Clear city"
              />
            </FieldBlock>

            <FieldBlock
              label="SCHEDULE"
              tagRight={nights ? <ChipPill text={nights} /> : null}
              error={errors.checkIn || errors.checkOut}
            >
              <ScheduleField
                leftLabel="CHECK IN"
                leftValue={checkIn ? format(checkIn, 'EEE, d MMM') : ''}
                rightLabel="CHECK OUT"
                rightValue={checkOut ? format(checkOut, 'EEE, d MMM') : ''}
                onPress={() => setDatesOpen(true)}
              />
            </FieldBlock>

            <FieldBlock label="PREFERRED HOTEL" tagRight={<OptionalPill />}>
              <IconTapField
                icon="home"
                value={preferredHotel}
                placeholder="No preference"
                onPress={() => setHotelOpen(true)}
              />
              {showQuickSelect ? (
                <>
                  <Text style={hotelStyles.quickSelectLabel}>QUICK SELECT</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={hotelStyles.monoRow}
                  >
                    {quickBrands.map((brand) => {
                      const selected =
                        preferredHotelBrandId === brand.brandId ||
                        (!preferredHotelBrandId && preferredHotel === brand.name);
                      return (
                        <Pressable
                          key={brand.brandId}
                          onPress={() =>
                            setPreferredBrand(
                              selected
                                ? { name: '', brandId: null }
                                : { name: brand.name, brandId: brand.brandId },
                            )
                          }
                          style={hotelStyles.monoItem}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <View style={[hotelStyles.mono, selected && hotelStyles.monoSelected]}>
                            <Text
                              style={[
                                hotelStyles.monoText,
                                selected && hotelStyles.monoTextSelected,
                              ]}
                            >
                              {brand.monogram}
                            </Text>
                          </View>
                          <Text
                            style={[
                              hotelStyles.monoCaption,
                              selected && hotelStyles.monoCaptionSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {brand.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}
            </FieldBlock>

            <CountFieldRow
              label="NUMBER OF ROOMS"
              helper="How many rooms do you need?"
              value={roomCount}
              onChange={setRoomCount}
              min={1}
              max={20}
              error={errors.roomCount}
              accessibilityLabel="Number of rooms"
            />
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <TravellersTabContent
            counts={counts}
            onChange={setCounts}
            showChildAges={false}
            error={errors.counts}
            infoText="Complimentary cots & extra bedding arranged on request."
          />
        ) : null}

        {tab === 'notes' ? (
          <NotesTabContent
            notes={notes}
            onChangeNotes={setNotes}
            chips={chips}
            chipOptions={NOTE_CHIPS}
            onToggleChip={toggleChip}
            infoText="Your private concierge reviews all notes and liaises directly with the hotel general manager prior to arrival."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <CitySearchSheet
        visible={cityOpen}
        initialQuery={city}
        onClose={() => setCityOpen(false)}
        onSelect={(place) => {
          setCity(place.mainText);
          setPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <DateRangeSheet
        visible={datesOpen}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setDatesOpen(false)}
        onApply={(a, b) => {
          setCheckIn(a);
          setCheckOut(b);
          setDatesOpen(false);
        }}
      />
      <HotelPreferenceSheet
        visible={hotelOpen}
        value={preferredHotel}
        valueBrandId={preferredHotelBrandId}
        onClose={() => setHotelOpen(false)}
        onSelect={setPreferredBrand}
      />
      <SummarySheet
        visible={summaryOpen}
        rows={summaryRows}
        completedCount={completedSections}
        totalCount={4}
        onClose={() => setSummaryOpen(false)}
      />
    </>
  );
}

/** Hotel-only quick-select brand chips (catalog UI). */
const hotelStyles = StyleSheet.create({
  quickSelectLabel: {
    marginTop: 10,
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
  },
  monoRow: {
    marginTop: 8,
    gap: 10,
    paddingRight: 8,
  },
  monoItem: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  mono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoSelected: { backgroundColor: colors.forest },
  monoText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    color: colors.forest,
  },
  monoTextSelected: { color: colors.sand },
  monoCaption: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  monoCaptionSelected: {
    color: colors.forest,
  },
});
