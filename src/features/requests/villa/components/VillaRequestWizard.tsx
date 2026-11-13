/**
 * Villa New request — Stay · Travellers · Notes · Review wizard.
 */
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
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
import { mapVillaFormToAppRequest } from '@/features/requests/villa/mapVillaFormToAppRequest';
import {
  ChipPill,
  CountFieldRow,
  FieldBlock,
  NotesTabContent,
  ReviewTabContent,
  ScheduleField,
  TapField,
  TravellersTabContent,
  useWizardFieldStyles,
} from '@/features/requests/wizard/fields/WizardFields';
import { RequestSuccessView } from '@/features/requests/wizard/RequestSuccessView';
import { RequestWizardShell } from '@/features/requests/wizard/RequestWizardShell';
import { DateRangeSheet } from '@/features/requests/wizard/sheets/DateRangeSheet';
import { PlaceSearchSheet } from '@/features/requests/wizard/sheets/PlaceSearchSheet';
import { SummarySheet } from '@/features/requests/wizard/sheets/SummarySheet';
import type { WizardTabConfig, WizardTabId } from '@/features/requests/wizard/types';

const NOTE_CHIPS = [
  'Private chef',
  'Pool heating',
  'Staffed villa',
  'Near beach',
  'EV charger',
  'Baby equipment',
] as const;

type VillaRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

function nightsLabel(checkIn: Date | null, checkOut: Date | null): string {
  if (!checkIn || !checkOut) return '';
  const n = differenceInCalendarDays(startOfDay(checkOut), startOfDay(checkIn));
  if (n <= 0) return '';
  return `${n} night${n === 1 ? '' : 's'}`;
}

export function VillaRequestWizard({ onBack, clearTabBar }: VillaRequestWizardProps) {
  const styles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [destination, setDestination] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [bedrooms, setBedrooms] = useState(5);
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [placeOpen, setPlaceOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

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
      !requireText(destination, 'Destination') &&
      !requireDateOnOrAfterToday(checkIn, 'Check-in') &&
      !requireDateOnOrAfterToday(checkOut, 'Check-out') &&
      !requireEndOnOrAfterStart(checkIn, checkOut, 'Check-out', 'Check-in') &&
      !requirePositiveCount(bedrooms, 'Bedrooms')
    );
  }, [bedrooms, checkIn, checkOut, destination]);

  const travellersValid = useMemo(() => {
    const partyErr = requireTravellerParty(counts);
    if (partyErr) return false;
    if (counts.children > 0 && childAges.slice(0, counts.children).some((a) => !a)) return false;
    return true;
  }, [childAges, counts]);

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

  const disabledTabs = useMemo(
    () => ({
      review: !stayValid,
    }),
    [stayValid],
  );

  const nights = nightsLabel(checkIn, checkOut);
  const pax = totalTravellers(counts);

  const summaryPrimary =
    [destination || null, nights || null].filter(Boolean).join(' · ') || 'Add stay details';
  const summarySecondary = [
    pax > 0 ? `${pax} traveller${pax === 1 ? '' : 's'}` : null,
    `${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const summaryRows = useMemo(
    () => [
      { id: 'destination', label: 'DESTINATION', value: destination, icon: 'pin' as const },
      {
        id: 'dates',
        label: 'SCHEDULE',
        value:
          checkIn && checkOut
            ? `${format(checkIn, 'd MMM')} – ${format(checkOut, 'd MMM yyyy')}${nights ? ` (${nights})` : ''}`
            : '',
        icon: 'calendar' as const,
      },
      {
        id: 'bedrooms',
        label: 'BEDROOMS',
        value: `${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`,
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
    [bedrooms, checkIn, checkOut, chips, counts, destination, nights, notes, pax],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    stayValid,
  ].filter(Boolean).length;

  const validateStay = useCallback(() => {
    const next: Record<string, string> = {};
    const destErr = requireText(destination, 'Destination');
    const inErr = requireDateOnOrAfterToday(checkIn, 'Check-in');
    const outErr =
      requireDateOnOrAfterToday(checkOut, 'Check-out') ||
      requireEndOnOrAfterStart(checkIn, checkOut, 'Check-out', 'Check-in');
    const bedErr = requirePositiveCount(bedrooms, 'Bedrooms');
    if (destErr) next.destination = destErr;
    if (inErr) next.checkIn = inErr;
    if (outErr) next.checkOut = outErr;
    if (bedErr) next.bedrooms = bedErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [bedrooms, checkIn, checkOut, destination]);

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
      setConfirmed((prev) => ({ ...prev, notes: true, travellers: true }));
      setTab('review');
      return;
    }

    const party = ensureMinAdultParty(counts);
    if (party !== counts) setCounts(party);
    setConfirmed((prev) => ({ ...prev, travellers: true, notes: true }));

    const noteParts = [notes.trim(), ...chips].filter(Boolean);
    const result = await submitRequest(
      mapVillaFormToAppRequest({
        destination,
        placeId,
        checkIn,
        checkOut,
        bedrooms,
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
    bedrooms,
    checkIn,
    checkOut,
    chips,
    counts,
    destination,
    notes,
    placeId,
    submitRequest,
    acceptTravellers,
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
        title="Villa"
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
          <View style={styles.stack}>
            <FieldBlock
              label="DESTINATION"
              tag="REQUIRED"
              error={errors.destination}
              helper="Search destination"
            >
              <TapField
                value={destination}
                placeholder="Saint-Tropez"
                onPress={() => setPlaceOpen(true)}
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

            <CountFieldRow
              label="BEDROOMS"
              helper="How many bedrooms do you need?"
              value={bedrooms}
              onChange={setBedrooms}
              min={1}
              max={20}
              error={errors.bedrooms}
            />
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <TravellersTabContent
            counts={counts}
            onChange={(next) => {
              setCounts(next);
              setChildAges((prev) => {
                const copy = [...prev];
                while (copy.length < next.children) copy.push(7);
                return copy.slice(0, Math.max(next.children, 0));
              });
            }}
            childAges={childAges}
            onChildAgeChange={(index, age) =>
              setChildAges((prev) => {
                const next = [...prev];
                next[index] = age;
                return next;
              })
            }
            showChildAges
            error={errors.counts}
            infoText="Complimentary cots and extra bedding arranged on request."
          />
        ) : null}

        {tab === 'notes' ? (
          <NotesTabContent
            notes={notes}
            onChangeNotes={setNotes}
            chips={chips}
            chipOptions={NOTE_CHIPS}
            onToggleChip={toggleChip}
            infoText="Your concierge reviews all notes before shortlisting villas with local partners."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <PlaceSearchSheet
        visible={placeOpen}
        title="Destination"
        placeholder="Saint-Tropez"
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
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setDatesOpen(false)}
        onApply={(a, b) => {
          setCheckIn(a);
          setCheckOut(b);
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
