/**
 * Yacht New request — Charter · Guests · Notes · Review wizard.
 */
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTimeFieldPicker } from '@/features/requests/components/DateTimeFieldPicker';
import { YACHT_CHARTER_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { formatDisplayTime } from '@/features/requests/shared/formDateUtils';
import { DEFAULT_PARTY_SIZE, ensureMinPartySize } from '@/features/requests/shared/travellerCounts';
import {
  requireDate,
  requireDateOnOrAfterToday,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
} from '@/features/requests/shared/validateRequestForm';
import { mapYachtFormToAppRequest } from '@/features/requests/yacht/mapYachtFormToAppRequest';
import {
  ChipPill,
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
import type { WizardTabConfig, WizardTabId } from '@/features/requests/wizard/types';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const NOTE_CHIPS = [
  'Crewed',
  'Watersports',
  'Chef onboard',
  'Marina berth',
  'Celebration',
] as const;

type YachtRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

function charterDaysLabel(start: Date | null, end: Date | null): string {
  if (!start || !end) return '';
  const n = differenceInCalendarDays(startOfDay(end), startOfDay(start));
  if (n <= 0) return '';
  return `${n} day${n === 1 ? '' : 's'}`;
}

export function YachtRequestWizard({ onBack, clearTabBar }: YachtRequestWizardProps) {
  const fieldStyles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [destination, setDestination] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [charterStart, setCharterStart] = useState<Date | null>(null);
  const [charterEnd, setCharterEnd] = useState<Date | null>(null);
  const [duration, setDuration] = useState<Date | null>(null);
  const [durationFlexible, setDurationFlexible] = useState(true);
  const [charterType, setCharterType] = useState('private');
  const [guests, setGuests] = useState(DEFAULT_PARTY_SIZE);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [placeOpen, setPlaceOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const tabs: WizardTabConfig[] = useMemo(
    () => [
      { id: 'details', label: 'Charter' },
      { id: 'travellers', label: 'Guests' },
      { id: 'notes', label: 'Notes' },
      { id: 'review', label: 'Review' },
    ],
    [],
  );

  const charterTypeLabel =
    YACHT_CHARTER_TYPE_OPTIONS.find((o) => o.id === charterType)?.label ?? 'Private';

  const charterValid = useMemo(() => {
    const base =
      !requireText(destination, 'Destination') &&
      !requireDateOnOrAfterToday(charterStart, 'Charter start') &&
      !requireDateOnOrAfterToday(charterEnd, 'Charter end') &&
      !requireEndOnOrAfterStart(charterStart, charterEnd, 'Charter end', 'Charter start');
    if (!base) return false;
    if (!durationFlexible && requireDate(duration, 'Duration')) return false;
    return true;
  }, [charterEnd, charterStart, destination, duration, durationFlexible]);

  const guestsValid = useMemo(() => !requirePositiveCount(guests, 'Guests'), [guests]);

  const completed = useMemo(
    () => ({
      details: Boolean(confirmed.details) && charterValid,
      travellers: Boolean(confirmed.details || confirmed.travellers) && charterValid && guestsValid,
      notes: Boolean(confirmed.notes),
      review: false,
    }),
    [charterValid, confirmed.details, confirmed.notes, confirmed.travellers, guestsValid],
  );

  const disabledTabs = useMemo(
    () => ({
      review: !charterValid,
    }),
    [charterValid],
  );

  const charterDays = charterDaysLabel(charterStart, charterEnd);
  const durationLabel = durationFlexible
    ? 'Flexible'
    : formatDisplayTime(duration) || 'Set duration';

  const summaryPrimary =
    [destination || null, charterDays || null].filter(Boolean).join(' · ') || 'Add charter details';
  const summarySecondary = [
    charterTypeLabel,
    `${guests} guest${guests === 1 ? '' : 's'}`,
    durationLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const summaryRows = useMemo(
    () => [
      { id: 'destination', label: 'DESTINATION', value: destination, icon: 'pin' as const },
      {
        id: 'dates',
        label: 'CHARTER DATES',
        value:
          charterStart && charterEnd
            ? `${format(charterStart, 'd MMM')} – ${format(charterEnd, 'd MMM yyyy')}${
                charterDays ? ` (${charterDays})` : ''
              }`
            : '',
        icon: 'calendar' as const,
      },
      {
        id: 'charter-type',
        label: 'CHARTER TYPE',
        value: charterTypeLabel,
        icon: 'boat' as const,
      },
      {
        id: 'duration',
        label: 'DURATION',
        value: durationLabel,
        icon: 'calendar' as const,
      },
      {
        id: 'guests',
        label: 'GUESTS',
        value: `${guests} guest${guests === 1 ? '' : 's'}`,
        icon: 'people' as const,
      },
      {
        id: 'notes',
        label: 'SPECIAL REQUESTS',
        value: [notes.trim(), ...chips].filter(Boolean).join(', '),
        icon: 'note' as const,
      },
    ],
    [
      charterDays,
      charterEnd,
      charterStart,
      charterTypeLabel,
      chips,
      destination,
      durationLabel,
      guests,
      notes,
    ],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    charterValid,
  ].filter(Boolean).length;

  const validateCharter = useCallback(() => {
    const next: Record<string, string> = {};
    const destErr = requireText(destination, 'Destination');
    const startErr = requireDateOnOrAfterToday(charterStart, 'Charter start');
    const endErr =
      requireDateOnOrAfterToday(charterEnd, 'Charter end') ||
      requireEndOnOrAfterStart(charterStart, charterEnd, 'Charter end', 'Charter start');
    if (destErr) next.destination = destErr;
    if (startErr) next.charterStart = startErr;
    if (endErr) next.charterEnd = endErr;
    if (!durationFlexible) {
      const durErr = requireDate(duration, 'Duration');
      if (durErr) next.duration = durErr;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [charterEnd, charterStart, destination, duration, durationFlexible]);

  const acceptGuests = useCallback(() => {
    const next = ensureMinPartySize(guests);
    if (next !== guests) setGuests(next);
    setErrors((prev) => {
      if (!prev.guests) return prev;
      const { guests: _ignored, ...rest } = prev;
      return rest;
    });
    setConfirmed((prev) => ({ ...prev, travellers: true }));
    return next;
  }, [guests]);

  const onContinue = useCallback(async () => {
    if (tab === 'details') {
      if (!validateCharter()) return;
      setConfirmed((prev) => ({ ...prev, details: true, travellers: true }));
      setTab('travellers');
      return;
    }
    if (tab === 'travellers') {
      acceptGuests();
      setTab('notes');
      return;
    }
    if (tab === 'notes') {
      setConfirmed((prev) => ({ ...prev, notes: true, travellers: true }));
      setTab('review');
      return;
    }

    const party = ensureMinPartySize(guests);
    if (party !== guests) setGuests(party);
    setConfirmed((prev) => ({ ...prev, travellers: true, notes: true }));

    const noteParts = [notes.trim(), ...chips].filter(Boolean);
    const result = await submitRequest(
      mapYachtFormToAppRequest({
        destination,
        placeId,
        charterStart,
        charterEnd,
        duration,
        durationFlexible,
        charterType: charterTypeLabel,
        guests: party,
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
    charterEnd,
    charterStart,
    charterTypeLabel,
    chips,
    destination,
    duration,
    durationFlexible,
    guests,
    notes,
    placeId,
    submitRequest,
    tab,
    acceptGuests,
    validateCharter,
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
        title="Yacht"
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
              label="DESTINATION"
              tag="REQUIRED"
              error={errors.destination}
              helper="Search destination"
            >
              <TapField
                value={destination}
                placeholder="Amalfi and Capri"
                onPress={() => setPlaceOpen(true)}
              />
            </FieldBlock>

            <FieldBlock
              label="CHARTER DATES"
              tagRight={charterDays ? <ChipPill text={charterDays} /> : null}
              error={errors.charterStart || errors.charterEnd}
            >
              <ScheduleField
                leftLabel="START"
                leftValue={charterStart ? format(charterStart, 'EEE, d MMM') : ''}
                rightLabel="END"
                rightValue={charterEnd ? format(charterEnd, 'EEE, d MMM') : ''}
                onPress={() => setDatesOpen(true)}
              />
            </FieldBlock>

            <FieldBlock label="CHARTER TYPE" tag="REQUIRED">
              <SegmentedChoice
                options={YACHT_CHARTER_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={charterType}
                onChange={setCharterType}
              />
            </FieldBlock>

            <FieldBlock label="DURATION" tag="OPTIONAL" error={errors.duration}>
              <View style={localStyles.durationBlock}>
                <DateTimeFieldPicker
                  label=""
                  value={durationFlexible ? null : duration}
                  onChange={(next) => {
                    setDurationFlexible(false);
                    setDuration(next);
                  }}
                  placeholder="10:00 AM"
                  mode="time"
                  accessibilityLabel="Duration"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: durationFlexible }}
                  onPress={() => {
                    setDurationFlexible(true);
                    setDuration(null);
                  }}
                  style={[
                    localStyles.flexibleChip,
                    durationFlexible && localStyles.flexibleChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      localStyles.flexibleLabel,
                      durationFlexible && localStyles.flexibleLabelSelected,
                    ]}
                  >
                    Flexible
                  </Text>
                </Pressable>
              </View>
            </FieldBlock>
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <View style={fieldStyles.stack}>
            <CountFieldRow
              label="GUESTS"
              helper="How many guests on board?"
              value={guests}
              onChange={setGuests}
              min={1}
              max={50}
              error={errors.guests}
            />
          </View>
        ) : null}

        {tab === 'notes' ? (
          <NotesTabContent
            notes={notes}
            onChangeNotes={setNotes}
            chips={chips}
            chipOptions={NOTE_CHIPS}
            onToggleChip={toggleChip}
            infoText="Your concierge liaises with captains and brokers to match your charter brief."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <PlaceSearchSheet
        visible={placeOpen}
        title="Destination"
        placeholder="Amalfi and Capri"
        initialQuery={destination}
        placeType="cities"
        onClose={() => setPlaceOpen(false)}
        onSelect={(place) => {
          setDestination(place.mainText);
          setPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <DateRangeSheet
        visible={datesOpen}
        checkIn={charterStart}
        checkOut={charterEnd}
        title="Charter dates"
        onClose={() => setDatesOpen(false)}
        onApply={(a, b) => {
          setCharterStart(a);
          setCharterEnd(b);
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

const localStyles = StyleSheet.create({
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
