/**
 * Private jet New request — Trip · Travellers · Notes · Review wizard.
 */
import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { PRIVATE_JET_TRIP_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import {
  mapPrivateJetFormToAppRequest,
  type PrivateJetTripType,
} from '@/features/requests/private-jet/mapPrivateJetFormToAppRequest';
import { DEFAULT_PARTY_SIZE, ensureMinPartySize } from '@/features/requests/shared/travellerCounts';
import {
  requireDateOnOrAfterToday,
  requireDistinctPlaces,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
} from '@/features/requests/shared/validateRequestForm';
import {
  CountFieldRow,
  FieldBlock,
  NotesTabContent,
  ReviewTabContent,
  ScheduleField,
  SegmentedChoice,
  TapField,
  useWizardFieldStyles,
} from '@/features/requests/wizard/fields/WizardFields';
import { RequestSuccessView } from '@/features/requests/wizard/RequestSuccessView';
import { RequestWizardShell } from '@/features/requests/wizard/RequestWizardShell';
import { DateRangeSheet } from '@/features/requests/wizard/sheets/DateRangeSheet';
import { PlaceSearchSheet } from '@/features/requests/wizard/sheets/PlaceSearchSheet';
import { SummarySheet } from '@/features/requests/wizard/sheets/SummarySheet';
import type {
  WizardSummaryRow,
  WizardTabConfig,
  WizardTabId,
} from '@/features/requests/wizard/types';

const NOTE_CHIPS = [
  'Catering',
  'Ground transfer',
  'Pet onboard',
  'Wi‑Fi',
  'Flexible timing',
] as const;

type PrivateJetRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

type PlaceSheetTarget = 'from' | 'to' | null;

export function PrivateJetRequestWizard({ onBack, clearTabBar }: PrivateJetRequestWizardProps) {
  const wizardFieldStyles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [tripType, setTripType] = useState<PrivateJetTripType>('one_way');
  const [flyingFrom, setFlyingFrom] = useState('');
  const [fromPlaceId, setFromPlaceId] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState('');
  const [toPlaceId, setToPlaceId] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(DEFAULT_PARTY_SIZE);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [placeSheet, setPlaceSheet] = useState<PlaceSheetTarget>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const needsReturn = tripType !== 'one_way';

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
    if (requireDateOnOrAfterToday(departure, 'Departure date')) return false;
    if (needsReturn) {
      if (requireDateOnOrAfterToday(returnDate, 'Return date')) return false;
      if (requireEndOnOrAfterStart(departure, returnDate, 'Return date', 'Departure date'))
        return false;
    }
    return true;
  }, [departure, flyingFrom, flyingTo, needsReturn, returnDate]);

  const travellersValid = useMemo(
    () => !requirePositiveCount(passengers, 'Passengers'),
    [passengers],
  );

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
    passengers > 0 ? `${passengers} passenger${passengers === 1 ? '' : 's'}` : null,
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
        id: 'passengers',
        label: 'PASSENGERS',
        value: `${passengers} passenger${passengers === 1 ? '' : 's'}`,
        icon: 'people',
      },
      {
        id: 'notes',
        label: 'SPECIAL REQUESTS',
        value: [notes.trim(), ...chips].filter(Boolean).join(', '),
        icon: 'note',
      },
    ],
    [chips, flyingFrom, flyingTo, notes, passengers, route, scheduleLabel],
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
    const depErr = requireDateOnOrAfterToday(departure, 'Departure date');
    const retErr = needsReturn
      ? requireDateOnOrAfterToday(returnDate, 'Return date') ||
        requireEndOnOrAfterStart(departure, returnDate, 'Return date', 'Departure date')
      : null;
    if (fromErr) next.flyingFrom = fromErr;
    if (toErr) next.flyingTo = toErr;
    if (depErr) next.departure = depErr;
    if (retErr) next.returnDate = retErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [departure, flyingFrom, flyingTo, needsReturn, returnDate]);

  const acceptPassengers = useCallback(() => {
    const next = ensureMinPartySize(passengers);
    if (next !== passengers) setPassengers(next);
    setErrors((prev) => {
      if (!prev.passengers) return prev;
      const { passengers: _ignored, ...rest } = prev;
      return rest;
    });
    setConfirmed((prev) => ({ ...prev, travellers: true }));
    return next;
  }, [passengers]);

  const onContinue = useCallback(async () => {
    if (tab === 'details') {
      if (!validateTrip()) return;
      setConfirmed((prev) => ({ ...prev, details: true, travellers: true }));
      setTab('travellers');
      return;
    }
    if (tab === 'travellers') {
      acceptPassengers();
      setTab('notes');
      return;
    }
    if (tab === 'notes') {
      setConfirmed((prev) => ({ ...prev, notes: true, travellers: true }));
      setTab('review');
      return;
    }

    const pax = ensureMinPartySize(passengers);
    if (pax !== passengers) setPassengers(pax);
    setConfirmed((prev) => ({ ...prev, travellers: true, notes: true }));

    const noteParts = [notes.trim(), ...chips].filter(Boolean);
    const result = await submitRequest(
      mapPrivateJetFormToAppRequest({
        tripType,
        flyingFrom,
        fromPlaceId,
        flyingTo,
        toPlaceId,
        departure,
        returnDate: needsReturn ? returnDate : null,
        passengers: pax,
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
    chips,
    departure,
    flyingFrom,
    flyingTo,
    fromPlaceId,
    needsReturn,
    notes,
    passengers,
    returnDate,
    submitRequest,
    tab,
    toPlaceId,
    tripType,
    acceptPassengers,
    validateTrip,
  ]);

  const toggleChip = (chip: string) => {
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  };

  const onTripTypeChange = (next: string) => {
    setTripType(next as PrivateJetTripType);
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
        title="Private jet"
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
                options={PRIVATE_JET_TRIP_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={tripType}
                onChange={onTripTypeChange}
              />
            </FieldBlock>

            <FieldBlock
              label="FLYING FROM"
              tag="REQUIRED"
              error={errors.flyingFrom}
              helper="Airport or FBO"
            >
              <TapField
                value={flyingFrom}
                placeholder="Farnborough"
                onPress={() => setPlaceSheet('from')}
              />
            </FieldBlock>

            <FieldBlock label="FLYING TO" tag="REQUIRED" error={errors.flyingTo}>
              <TapField
                value={flyingTo}
                placeholder="Sion Airport (SIR)"
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
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <View style={wizardFieldStyles.stack}>
            <CountFieldRow
              label="PASSENGERS"
              helper="Including yourself (min 1)"
              value={passengers}
              onChange={setPassengers}
              min={1}
              max={20}
              error={errors.passengers}
            />
            <View style={wizardFieldStyles.infoBox}>
              <Text style={wizardFieldStyles.infoText}>
                Aircraft size and range depend on passenger count and baggage — your concierge will
                shortlist suitable jets.
              </Text>
            </View>
          </View>
        ) : null}

        {tab === 'notes' ? (
          <NotesTabContent
            notes={notes}
            onChangeNotes={setNotes}
            chips={chips}
            chipOptions={NOTE_CHIPS}
            onToggleChip={toggleChip}
            infoText="Catering, pets, and ground transport can all be arranged before you fly."
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
        footerHint="Departure time is flexible until your concierge confirms the aircraft."
        nightsLabel={false}
        onClose={() => setDatesOpen(false)}
        onApply={(start, end) => {
          setDeparture(start);
          setReturnDate(end);
          setDatesOpen(false);
        }}
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
