/**
 * Something else New request — Details · Travellers · Notes · Review wizard.
 */
import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import {
  ensureMinAdultParty,
  formatTravellerCountLabel,
  INITIAL_TRAVELLER_COUNTS,
  totalTravellers,
  type TravellerCounts,
} from '@/features/requests/shared/travellerCounts';
import {
  requireDateOnOrAfterToday,
  requireEndOnOrAfterStart,
  requireText,
  requireTravellerParty,
} from '@/features/requests/shared/validateRequestForm';
import { mapSomethingElseFormToAppRequest } from '@/features/requests/something-else/mapSomethingElseFormToAppRequest';
import {
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
import type {
  WizardSummaryRow,
  WizardTabConfig,
  WizardTabId,
} from '@/features/requests/wizard/types';

const NOTE_CHIPS = ['Dining', 'Tickets', 'Experience', 'Gift', 'Other'] as const;

type SomethingElseRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function SomethingElseRequestWizard({
  onBack,
  clearTabBar,
}: SomethingElseRequestWizardProps) {
  const styles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [city, setCity] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [whenStart, setWhenStart] = useState<Date | null>(null);
  const [whenEnd, setWhenEnd] = useState<Date | null>(null);
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [cityOpen, setCityOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const tabs: WizardTabConfig[] = useMemo(
    () => [
      { id: 'details', label: 'Details' },
      { id: 'travellers', label: 'Travellers' },
      { id: 'notes', label: 'Notes' },
      { id: 'review', label: 'Review' },
    ],
    [],
  );

  const detailsValid = useMemo(() => {
    if (requireText(city, 'City')) return false;
    if (requireDateOnOrAfterToday(whenStart, 'When — from')) return false;
    if (whenEnd && requireEndOnOrAfterStart(whenStart, whenEnd, 'When — until', 'When — from')) {
      return false;
    }
    return true;
  }, [city, whenEnd, whenStart]);

  const travellersValid = useMemo(() => !requireTravellerParty(counts), [counts]);

  const notesBody = [notes.trim(), ...chips].filter(Boolean).join('. ');

  const completed = useMemo(
    () => ({
      details: Boolean(confirmed.details) && detailsValid,
      travellers:
        Boolean(confirmed.details || confirmed.travellers) && detailsValid && travellersValid,
      notes: Boolean(confirmed.notes),
      review: false,
    }),
    [confirmed.details, confirmed.notes, confirmed.travellers, detailsValid, travellersValid],
  );

  const disabledTabs = useMemo(
    () => ({
      review: !detailsValid,
    }),
    [detailsValid],
  );

  const pax = totalTravellers(counts);
  const scheduleLabel = whenStart
    ? whenEnd
      ? `${format(whenStart, 'd MMM')} – ${format(whenEnd, 'd MMM yyyy')}`
      : format(whenStart, 'EEE, d MMM yyyy')
    : '';

  const summaryPrimary = city || 'Add details';
  const summarySecondary = [scheduleLabel || null, pax ? `${pax} travellers` : null]
    .filter(Boolean)
    .join(' · ');

  const summaryRows: WizardSummaryRow[] = useMemo(
    () => [
      { id: 'city', label: 'CITY', value: city, icon: 'pin' },
      { id: 'when', label: 'WHEN', value: scheduleLabel, icon: 'calendar' },
      {
        id: 'travellers',
        label: 'TRAVELLERS',
        value: formatTravellerCountLabel(counts),
        icon: 'people',
      },
      {
        id: 'notes',
        label: 'WHAT YOU NEED',
        value: notesBody,
        icon: 'note',
      },
    ],
    [city, counts, notesBody, scheduleLabel],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    detailsValid,
  ].filter(Boolean).length;

  const validateDetails = useCallback(() => {
    const next: Record<string, string> = {};
    const cityErr = requireText(city, 'City');
    const startErr = requireDateOnOrAfterToday(whenStart, 'When — from');
    const endErr = whenEnd
      ? requireEndOnOrAfterStart(whenStart, whenEnd, 'When — until', 'When — from')
      : null;
    if (cityErr) next.city = cityErr;
    if (startErr) next.whenStart = startErr;
    if (endErr) next.whenEnd = endErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [city, whenEnd, whenStart]);

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
      if (!validateDetails()) return;
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

    const result = await submitRequest(
      mapSomethingElseFormToAppRequest({
        city,
        placeId,
        whenStart,
        whenEnd: whenEnd || whenStart,
        counts: party,
        notes: notesBody,
        travellerIds: [],
        travellers: [],
      }),
      { suppressSuccessAlert: true },
    );
    if (result.ok) {
      setSuccessId(result.requestId ?? `GW-${Date.now().toString().slice(-6)}`);
    }
  }, [
    city,
    counts,
    notesBody,
    placeId,
    submitRequest,
    tab,
    acceptTravellers,
    validateDetails,
    whenEnd,
    whenStart,
  ]);

  if (successId) {
    return (
      <RequestSuccessView referenceId={successId} onViewRequest={onBack} onNewRequest={onBack} />
    );
  }

  return (
    <>
      <RequestWizardShell
        title="Something else"
        onBack={onBack}
        tabs={tabs}
        activeTab={tab}
        completed={completed}
        disabledTabs={disabledTabs}
        onChangeTab={setTab}
        summaryPrimary={summaryPrimary}
        summarySecondary={summarySecondary}
        ctaLabel={tab === 'review' ? 'Send to Godwit →' : 'Continue →'}
        ctaLoading={submitting}
        onPressSummary={() => setSummaryOpen(true)}
        onPressCta={() => void onContinue()}
        clearTabBar={clearTabBar}
      >
        {tab === 'details' ? (
          <View style={styles.stack}>
            <FieldBlock label="CITY" tag="REQUIRED" error={errors.city}>
              <TapField
                value={city}
                placeholder="City or region"
                onPress={() => setCityOpen(true)}
              />
            </FieldBlock>
            <FieldBlock label="WHEN" tag="REQUIRED" error={errors.whenStart || errors.whenEnd}>
              <ScheduleField
                leftLabel="FROM"
                leftValue={whenStart ? format(whenStart, 'EEE, d MMM') : ''}
                rightLabel="UNTIL"
                rightValue={whenEnd ? format(whenEnd, 'EEE, d MMM') : ''}
                rightEmptyLabel="Optional"
                onPress={() => setDatesOpen(true)}
              />
            </FieldBlock>
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <TravellersTabContent counts={counts} onChange={setCounts} error={errors.counts} />
        ) : null}

        {tab === 'notes' ? (
          <NotesTabContent
            notes={notes}
            onChangeNotes={setNotes}
            chips={chips}
            chipOptions={NOTE_CHIPS}
            onToggleChip={(chip) =>
              setChips((prev) =>
                prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
              )
            }
            infoText="A short brief is enough — your concierge will follow up with options."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <PlaceSearchSheet
        visible={cityOpen}
        title="City"
        placeholder="City or region"
        placeType="cities"
        initialQuery={city}
        onClose={() => setCityOpen(false)}
        onSelect={(place) => {
          setCity(place.mainText);
          setPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <DateRangeSheet
        visible={datesOpen}
        checkIn={whenStart}
        checkOut={whenEnd}
        mode="range"
        title="When"
        footerHint="End date is optional."
        nightsLabel={false}
        optionalEnd
        onClose={() => setDatesOpen(false)}
        onApply={(a, b) => {
          setWhenStart(a);
          setWhenEnd(b);
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
