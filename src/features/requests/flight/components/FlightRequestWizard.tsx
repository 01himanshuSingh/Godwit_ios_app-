/**
 * Flight New request — Trip · Travellers · Notes · Review wizard.
 */
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CABIN_CLASS_OPTIONS,
  FLIGHT_TRIP_TYPE_OPTIONS,
  type InventoryOption,
} from '@/features/requests/data/requestInventory';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import {
  mapFlightFormToAppRequest,
  type FlightTripType,
} from '@/features/requests/flight/mapFlightFormToAppRequest';
import {
  ensureMinAdultParty,
  formatTravellerCountLabel,
  INITIAL_TRAVELLER_COUNTS,
  totalTravellers,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';
import {
  requireDateOnOrAfterToday,
  requireDistinctPlaces,
  requireEndOnOrAfterStart,
  requireText,
  requireTravellerParty,
} from '@/features/requests/shared/validateRequestForm';
import {
  FieldBlock,
  NotesTabContent,
  ReviewTabContent,
  ScheduleField,
  SegmentedChoice,
  TapField,
  TravellersTabContent,
  useWizardFieldStyles,
} from '@/features/requests/wizard/fields/WizardFields';
import { RequestSuccessView } from '@/features/requests/wizard/RequestSuccessView';
import { RequestWizardShell } from '@/features/requests/wizard/RequestWizardShell';
import {
  AirlinePreferenceSheet,
  type AirlineSelection,
} from '@/features/requests/wizard/sheets/AirlinePreferenceSheet';
import { DateRangeSheet } from '@/features/requests/wizard/sheets/DateRangeSheet';
import { OptionListSheet } from '@/features/requests/wizard/sheets/OptionListSheet';
import { PlaceSearchSheet } from '@/features/requests/wizard/sheets/PlaceSearchSheet';
import { SummarySheet } from '@/features/requests/wizard/sheets/SummarySheet';
import type {
  WizardSummaryRow,
  WizardTabConfig,
  WizardTabId,
} from '@/features/requests/wizard/types';
import {
  cacheAirline,
  getAirlinesQuickSelect,
  getCabinClasses,
  AIRLINES_QUICK_SELECT_SIZE,
} from '@/lib/firebase/masterData';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const NOTE_CHIPS = [
  'Window seat',
  'Extra legroom',
  'Special meal',
  'Lounge access',
  'Fast track',
  'Assistive needs',
] as const;

type FlightRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

type PlaceSheetTarget = 'from' | 'to' | null;

export function FlightRequestWizard({ onBack, clearTabBar }: FlightRequestWizardProps) {
  const wizardFieldStyles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [tripType, setTripType] = useState<FlightTripType>('round_trip');
  const [flyingFrom, setFlyingFrom] = useState('');
  const [fromPlaceId, setFromPlaceId] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState('');
  const [toPlaceId, setToPlaceId] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [preferredAirline, setPreferredAirline] = useState('');
  const [preferredAirlineId, setPreferredAirlineId] = useState<string | null>(null);
  const [preferredAirlineCode, setPreferredAirlineCode] = useState<string | null>(null);
  const [cabinClass, setCabinClass] = useState('Business');
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [placeSheet, setPlaceSheet] = useState<PlaceSheetTarget>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const [airlineOpen, setAirlineOpen] = useState(false);
  const [cabinOpen, setCabinOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const needsReturn = tripType !== 'one_way';

  const quickAirlinesQuery = useQuery({
    queryKey: ['masterData', 'airlines', 'quickSelect', AIRLINES_QUICK_SELECT_SIZE],
    queryFn: () => getAirlinesQuickSelect(AIRLINES_QUICK_SELECT_SIZE),
    staleTime: 5 * 60 * 1000,
  });
  const quickAirlines = quickAirlinesQuery.data ?? [];
  const showAirlineQuickSelect = quickAirlines.length > 0;

  /** Cabin classes from masterData/airlines/items/{airlineId}.cabinClasses[] */
  const cabinClassesQuery = useQuery({
    queryKey: ['masterData', 'airlines', 'cabinClasses', preferredAirlineId],
    queryFn: () => getCabinClasses(preferredAirlineId!),
    enabled: Boolean(preferredAirlineId),
    staleTime: 5 * 60 * 1000,
  });

  const cabinOptions = useMemo((): readonly InventoryOption[] => {
    const fromAirline = (cabinClassesQuery.data ?? []).filter(Boolean);
    if (preferredAirlineId && fromAirline.length > 0) {
      return fromAirline.map((label) => ({
        id: label.toLowerCase().replace(/\s+/g, '_'),
        label,
      }));
    }
    // No airline selected (or airline has empty cabinClasses) — static fallback.
    return CABIN_CLASS_OPTIONS;
  }, [cabinClassesQuery.data, preferredAirlineId]);

  const cabinClassForSubmit = useMemo(() => {
    const classes = cabinClassesQuery.data;
    if (preferredAirlineId && classes && classes.length > 0 && !classes.includes(cabinClass)) {
      return classes[0]!;
    }
    return cabinClass;
  }, [cabinClass, cabinClassesQuery.data, preferredAirlineId]);

  const setPreferredAirlineSelection = useCallback((next: AirlineSelection) => {
    setPreferredAirline(next.label);
    setPreferredAirlineId(next.airlineId);
    setPreferredAirlineCode(next.code);
    if (next.airlineId) {
      cacheAirline({
        airlineId: next.airlineId,
        code: next.code || '',
        name: next.label,
        label: next.label,
        monogram: (next.code || next.label).slice(0, 3).toUpperCase(),
        cabinClasses: next.cabinClasses.filter(Boolean),
        isActive: true,
      });
    }
    if (next.cabinClasses.length > 0) {
      setCabinClass((prev) =>
        next.cabinClasses.includes(prev) ? prev : (next.cabinClasses[0] ?? prev),
      );
    }
  }, []);

  const tabs: WizardTabConfig[] = useMemo(
    () => [
      { id: 'details', label: 'Trip' },
      { id: 'travellers', label: 'Travellers' },
      { id: 'notes', label: 'Notes' },
      { id: 'review', label: 'Review' },
    ],
    [],
  );

  const tripValid = useMemo(() => {
    if (requireText(flyingFrom, 'Flying from')) return false;
    if (requireText(flyingTo, 'Flying to')) return false;
    if (requireDistinctPlaces(flyingFrom, flyingTo)) return false;
    if (requireDateOnOrAfterToday(departure, 'Departure')) return false;
    if (needsReturn) {
      if (requireDateOnOrAfterToday(returnDate, 'Return date')) return false;
      if (requireEndOnOrAfterStart(departure, returnDate, 'Return date', 'Departure')) return false;
    }
    if (requireText(cabinClassForSubmit, 'Cabin class', { minLength: 1 })) return false;
    return true;
  }, [cabinClassForSubmit, departure, flyingFrom, flyingTo, needsReturn, returnDate]);

  const travellersValid = useMemo(() => !requireTravellerParty(counts), [counts]);

  const completed = useMemo(
    () => ({
      details: Boolean(confirmed.details) && tripValid,
      travellers:
        Boolean(confirmed.details || confirmed.travellers) && tripValid && travellersValid,
      notes: Boolean(confirmed.notes),
      review: false,
    }),
    [confirmed.details, confirmed.notes, confirmed.travellers, tripValid, travellersValid],
  );

  const disabledTabs = useMemo(
    () => ({
      review: !tripValid,
    }),
    [tripValid],
  );

  const pax = totalTravellers(counts);
  const route =
    flyingFrom && flyingTo ? `${flyingFrom} → ${flyingTo}` : flyingFrom || flyingTo || '';

  const scheduleLabel = useMemo(() => {
    if (!departure) return '';
    if (needsReturn && returnDate) {
      return `${format(departure, 'd MMM')} – ${format(returnDate, 'd MMM yyyy')}`;
    }
    return format(departure, 'EEE, d MMM yyyy');
  }, [departure, needsReturn, returnDate]);

  const summaryPrimary = route || 'Add trip details';
  const summarySecondary = [
    scheduleLabel || null,
    pax > 0 ? `${pax} traveller${pax === 1 ? '' : 's'}` : null,
    cabinClassForSubmit || null,
  ]
    .filter(Boolean)
    .join(' · ');

  const summaryRows: WizardSummaryRow[] = useMemo(
    () => [
      {
        id: 'route',
        label: 'ROUTE',
        value: route,
        icon: 'plane',
      },
      {
        id: 'flying-from',
        label: 'FLYING FROM',
        value: flyingFrom,
        icon: 'pin',
      },
      {
        id: 'flying-to',
        label: 'FLYING TO',
        value: flyingTo,
        icon: 'pin',
      },
      {
        id: 'schedule',
        label: 'SCHEDULE',
        value: scheduleLabel,
        icon: 'calendar',
      },
      {
        id: 'airline',
        label: 'PREFERRED AIRLINE',
        value: preferredAirline || 'No preference',
        icon: 'plane',
      },
      {
        id: 'cabin',
        label: 'CABIN CLASS',
        value: cabinClassForSubmit,
        icon: 'plane',
      },
      {
        id: 'travellers',
        label: 'TRAVELLERS',
        value: formatTravellerCountLabel(counts),
        icon: 'people',
      },
      {
        id: 'notes',
        label: 'SPECIAL REQUESTS',
        value: [notes.trim(), ...chips].filter(Boolean).join(', '),
        icon: 'note',
      },
    ],
    [
      cabinClassForSubmit,
      chips,
      counts,
      flyingFrom,
      flyingTo,
      notes,
      preferredAirline,
      route,
      scheduleLabel,
    ],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    tripValid,
  ].filter(Boolean).length;

  const validateTrip = useCallback(() => {
    const next: Record<string, string> = {};
    const fromErr = requireText(flyingFrom, 'Flying from');
    const toErr = requireText(flyingTo, 'Flying to') || requireDistinctPlaces(flyingFrom, flyingTo);
    const depErr = requireDateOnOrAfterToday(departure, 'Departure');
    let retErr = needsReturn
      ? requireDateOnOrAfterToday(returnDate, 'Return date') ||
        requireEndOnOrAfterStart(departure, returnDate, 'Return date', 'Departure')
      : null;
    const cabinErr = requireText(cabinClassForSubmit, 'Cabin class', { minLength: 1 });
    if (fromErr) next.flyingFrom = fromErr;
    if (toErr) next.flyingTo = toErr;
    if (depErr) next.departure = depErr;
    if (retErr) next.returnDate = retErr;
    if (cabinErr) next.cabinClass = cabinErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [cabinClassForSubmit, departure, flyingFrom, flyingTo, needsReturn, returnDate]);

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
      if (!validateTrip()) return;
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
      setConfirmed((prev) => ({ ...prev, notes: true, travellers: true }));
      setTab('review');
      return;
    }

    const party = ensureMinAdultParty(counts);
    if (party !== counts) setCounts(party);
    setConfirmed((prev) => ({ ...prev, travellers: true, notes: true }));

    const noteParts = [notes.trim(), ...chips].filter(Boolean);
    const result = await submitRequest(
      mapFlightFormToAppRequest({
        tripType,
        flyingFrom,
        fromPlaceId,
        flyingTo,
        toPlaceId,
        departure,
        returnDate: needsReturn ? returnDate : null,
        preferredAirline,
        preferredAirlineId,
        preferredAirlineCode,
        cabinClass: cabinClassForSubmit,
        counts: party,
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
    cabinClassForSubmit,
    chips,
    counts,
    departure,
    flyingFrom,
    flyingTo,
    fromPlaceId,
    needsReturn,
    notes,
    preferredAirline,
    preferredAirlineCode,
    preferredAirlineId,
    returnDate,
    submitRequest,
    tab,
    toPlaceId,
    tripType,
    acceptTravellers,
    validateTrip,
  ]);

  const toggleChip = (chip: string) => {
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  };

  const onTripTypeChange = (next: string) => {
    setTripType(next as FlightTripType);
    if (next === 'one_way') {
      setReturnDate(null);
      setErrors((prev) => {
        const { returnDate: _r, ...rest } = prev;
        return rest;
      });
    }
  };

  if (successId) {
    return (
      <RequestSuccessView referenceId={successId} onViewRequest={onBack} onNewRequest={onBack} />
    );
  }

  return (
    <>
      <RequestWizardShell
        title="Flight"
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
          <View style={wizardFieldStyles.stack}>
            <FieldBlock label="TRIP TYPE" tag="REQUIRED">
              <SegmentedChoice
                options={FLIGHT_TRIP_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={tripType}
                onChange={onTripTypeChange}
              />
            </FieldBlock>

            <FieldBlock
              label="FLYING FROM"
              tag="REQUIRED"
              error={errors.flyingFrom}
              helper="Airport search"
            >
              <TapField
                value={flyingFrom}
                placeholder="London (LHR)"
                onPress={() => setPlaceSheet('from')}
              />
            </FieldBlock>

            <FieldBlock label="FLYING TO" tag="REQUIRED" error={errors.flyingTo}>
              <TapField
                value={flyingTo}
                placeholder="Geneva (GVA)"
                onPress={() => setPlaceSheet('to')}
              />
            </FieldBlock>

            <FieldBlock
              label="SCHEDULE"
              tag="REQUIRED"
              error={errors.departure || errors.returnDate}
            >
              {needsReturn ? (
                <ScheduleField
                  leftLabel="DEPARTURE"
                  leftValue={departure ? format(departure, 'EEE, d MMM') : ''}
                  rightLabel="RETURN"
                  rightValue={returnDate ? format(returnDate, 'EEE, d MMM') : ''}
                  onPress={() => setDatesOpen(true)}
                />
              ) : (
                <TapField
                  value={departure ? format(departure, 'EEE, d MMM yyyy') : ''}
                  placeholder="Select departure date"
                  onPress={() => setDatesOpen(true)}
                />
              )}
            </FieldBlock>

            <FieldBlock label="PREFERRED AIRLINE" tag="Optional">
              <TapField
                value={preferredAirline}
                placeholder="No preference"
                onPress={() => setAirlineOpen(true)}
              />
              {showAirlineQuickSelect ? (
                <>
                  <Text style={airlineStyles.quickSelectLabel}>QUICK SELECT</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={airlineStyles.monoRow}
                  >
                    {quickAirlines.map((airline) => {
                      const selected =
                        preferredAirlineId === airline.airlineId ||
                        (!preferredAirlineId &&
                          (preferredAirline === airline.label ||
                            preferredAirline === airline.name));
                      return (
                        <Pressable
                          key={airline.airlineId}
                          onPress={() =>
                            setPreferredAirlineSelection(
                              selected
                                ? {
                                    label: '',
                                    airlineId: null,
                                    code: null,
                                    cabinClasses: [],
                                  }
                                : {
                                    label: airline.label,
                                    airlineId: airline.airlineId,
                                    code: airline.code || null,
                                    cabinClasses: airline.cabinClasses,
                                  },
                            )
                          }
                          style={airlineStyles.monoItem}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <View
                            style={[airlineStyles.mono, selected && airlineStyles.monoSelected]}
                          >
                            <Text
                              style={[
                                airlineStyles.monoText,
                                selected && airlineStyles.monoTextSelected,
                              ]}
                            >
                              {airline.monogram}
                            </Text>
                          </View>
                          <Text
                            style={[
                              airlineStyles.monoCaption,
                              selected && airlineStyles.monoCaptionSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {airline.code || airline.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}
            </FieldBlock>

            <FieldBlock label="CABIN CLASS" tag="REQUIRED" error={errors.cabinClass}>
              <TapField
                value={cabinClass}
                placeholder="Select cabin"
                onPress={() => setCabinOpen(true)}
              />
            </FieldBlock>
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <TravellersTabContent
            counts={counts}
            onChange={setCounts}
            showChildAges={false}
            error={errors.counts}
            infoText="Your concierge can arrange seats, meals, and lounge access once preferences are confirmed."
          />
        ) : null}

        {tab === 'notes' ? (
          <NotesTabContent
            notes={notes}
            onChangeNotes={setNotes}
            chips={chips}
            chipOptions={NOTE_CHIPS}
            onToggleChip={toggleChip}
            infoText="Share timing, loyalty numbers, or accessibility needs — we’ll handle the rest."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <PlaceSearchSheet
        visible={placeSheet === 'from'}
        title="Flying from"
        placeholder="Search airports"
        initialQuery={flyingFrom}
        placeType="airport"
        onClose={() => setPlaceSheet(null)}
        onSelect={(place) => {
          setFlyingFrom(place.mainText);
          setFromPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <PlaceSearchSheet
        visible={placeSheet === 'to'}
        title="Flying to"
        placeholder="Search airports"
        initialQuery={flyingTo}
        placeType="airport"
        onClose={() => setPlaceSheet(null)}
        onSelect={(place) => {
          setFlyingTo(place.mainText);
          setToPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <DateRangeSheet
        visible={datesOpen}
        checkIn={departure}
        checkOut={needsReturn ? returnDate : null}
        mode={needsReturn ? 'range' : 'single'}
        title={needsReturn ? 'Travel dates' : 'Departure date'}
        footerHint="Times are flexible until your concierge confirms options."
        nightsLabel={false}
        onClose={() => setDatesOpen(false)}
        onApply={(start, end) => {
          setDeparture(start);
          setReturnDate(end);
          setDatesOpen(false);
        }}
      />
      <AirlinePreferenceSheet
        visible={airlineOpen}
        value={preferredAirline}
        valueAirlineId={preferredAirlineId}
        onClose={() => setAirlineOpen(false)}
        onSelect={setPreferredAirlineSelection}
      />
      <OptionListSheet
        visible={cabinOpen}
        title="Cabin class"
        options={cabinOptions}
        value={cabinClass}
        onClose={() => setCabinOpen(false)}
        onSelect={(option) => setCabinClass(option?.label ?? '')}
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

const airlineStyles = StyleSheet.create({
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
