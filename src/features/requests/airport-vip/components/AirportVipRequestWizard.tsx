/**
 * Airport VIP New request — Service · Travellers · Notes · Review wizard.
 */
import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { mapAirportVipFormToAppRequest } from '@/features/requests/airport-vip/mapAirportVipFormToAppRequest';
import { AIRPORT_VIP_SERVICE_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
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
import { OptionListSheet } from '@/features/requests/wizard/sheets/OptionListSheet';
import { PlaceSearchSheet } from '@/features/requests/wizard/sheets/PlaceSearchSheet';
import { SummarySheet } from '@/features/requests/wizard/sheets/SummarySheet';
import type {
  WizardSummaryRow,
  WizardTabConfig,
  WizardTabId,
} from '@/features/requests/wizard/types';

const NOTE_CHIPS = [
  'Fast track',
  'Lounge',
  'Baggage assist',
  'Meet on aircraft',
  'Family assistance',
] as const;

type AirportVipRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function AirportVipRequestWizard({ onBack, clearTabBar }: AirportVipRequestWizardProps) {
  const styles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [airport, setAirport] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [serviceStart, setServiceStart] = useState<Date | null>(null);
  const [serviceEnd, setServiceEnd] = useState<Date | null>(null);
  const [serviceType, setServiceType] = useState('Arrival');
  const [counts, setCounts] = useState<TravellerCounts>(INITIAL_TRAVELLER_COUNTS);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [airportOpen, setAirportOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const tabs: WizardTabConfig[] = useMemo(
    () => [
      { id: 'details', label: 'Service' },
      { id: 'travellers', label: 'Travellers' },
      { id: 'notes', label: 'Notes' },
      { id: 'review', label: 'Review' },
    ],
    [],
  );

  const serviceValid = useMemo(() => {
    if (requireText(airport, 'Airport')) return false;
    if (requireDateOnOrAfterToday(serviceStart, 'Service start')) return false;
    if (
      serviceEnd &&
      requireEndOnOrAfterStart(serviceStart, serviceEnd, 'Service end', 'Service start')
    ) {
      return false;
    }
    if (requireText(serviceType, 'Service type', { minLength: 1 })) return false;
    return true;
  }, [airport, serviceEnd, serviceStart, serviceType]);

  const travellersValid = useMemo(() => !requireTravellerParty(counts), [counts]);

  const completed = useMemo(
    () => ({
      details: Boolean(confirmed.details) && serviceValid,
      travellers:
        Boolean(confirmed.details || confirmed.travellers) && serviceValid && travellersValid,
      notes: Boolean(confirmed.notes),
      review: false,
    }),
    [confirmed.details, confirmed.notes, confirmed.travellers, serviceValid, travellersValid],
  );

  const disabledTabs = useMemo(() => ({ review: !serviceValid }), [serviceValid]);

  const pax = totalTravellers(counts);
  const scheduleLabel = serviceStart
    ? serviceEnd
      ? `${format(serviceStart, 'd MMM')} – ${format(serviceEnd, 'd MMM yyyy')}`
      : format(serviceStart, 'EEE, d MMM yyyy')
    : '';

  const summaryPrimary = airport || 'Add service details';
  const summarySecondary = [serviceType || null, scheduleLabel || null, pax ? `${pax} pax` : null]
    .filter(Boolean)
    .join(' · ');

  const summaryRows: WizardSummaryRow[] = useMemo(
    () => [
      { id: 'airport', label: 'AIRPORT', value: airport, icon: 'plane' },
      { id: 'service', label: 'SERVICE TYPE', value: serviceType, icon: 'star' },
      { id: 'dates', label: 'SERVICE DATES', value: scheduleLabel, icon: 'calendar' },
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
    [airport, chips, counts, notes, scheduleLabel, serviceType],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    serviceValid,
  ].filter(Boolean).length;

  const validateService = useCallback(() => {
    const next: Record<string, string> = {};
    const airportErr = requireText(airport, 'Airport');
    const startErr = requireDateOnOrAfterToday(serviceStart, 'Service start');
    const endErr = serviceEnd
      ? requireEndOnOrAfterStart(serviceStart, serviceEnd, 'Service end', 'Service start')
      : null;
    const typeErr = requireText(serviceType, 'Service type', { minLength: 1 });
    if (airportErr) next.airport = airportErr;
    if (startErr) next.serviceStart = startErr;
    if (endErr) next.serviceEnd = endErr;
    if (typeErr) next.serviceType = typeErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [airport, serviceEnd, serviceStart, serviceType]);

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
      if (!validateService()) return;
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
      mapAirportVipFormToAppRequest({
        airport,
        placeId,
        serviceStart,
        serviceEnd: serviceEnd || serviceStart,
        serviceType,
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
    airport,
    chips,
    counts,
    notes,
    placeId,
    serviceEnd,
    serviceStart,
    serviceType,
    submitRequest,
    tab,
    acceptTravellers,
    validateService,
  ]);

  if (successId) {
    return (
      <RequestSuccessView referenceId={successId} onViewRequest={onBack} onNewRequest={onBack} />
    );
  }

  return (
    <>
      <RequestWizardShell
        title="Airport VIP"
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
            <FieldBlock label="AIRPORT" tag="REQUIRED" error={errors.airport}>
              <TapField
                value={airport}
                placeholder="Heathrow"
                onPress={() => setAirportOpen(true)}
              />
            </FieldBlock>
            <FieldBlock label="SERVICE TYPE" tag="REQUIRED" error={errors.serviceType}>
              <TapField
                value={serviceType}
                placeholder="Select"
                onPress={() => setServiceOpen(true)}
              />
            </FieldBlock>
            <FieldBlock
              label="SERVICE DATES"
              tag="REQUIRED"
              error={errors.serviceStart || errors.serviceEnd}
            >
              <ScheduleField
                leftLabel="START"
                leftValue={serviceStart ? format(serviceStart, 'EEE, d MMM') : ''}
                rightLabel="END"
                rightValue={serviceEnd ? format(serviceEnd, 'EEE, d MMM') : ''}
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
            infoText="Your VIP meet agent is briefed with flight details ahead of arrival."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <PlaceSearchSheet
        visible={airportOpen}
        title="Airport"
        placeholder="Heathrow"
        placeType="airport"
        initialQuery={airport}
        onClose={() => setAirportOpen(false)}
        onSelect={(place) => {
          setAirport(place.mainText);
          setPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <DateRangeSheet
        visible={datesOpen}
        checkIn={serviceStart}
        checkOut={serviceEnd}
        mode="range"
        title="Service dates"
        footerHint="End date is optional for same-day assistance."
        nightsLabel={false}
        optionalEnd
        onClose={() => setDatesOpen(false)}
        onApply={(a, b) => {
          setServiceStart(a);
          setServiceEnd(b);
          setDatesOpen(false);
        }}
      />
      <OptionListSheet
        visible={serviceOpen}
        title="Service type"
        options={AIRPORT_VIP_SERVICE_TYPE_OPTIONS}
        value={serviceType}
        onClose={() => setServiceOpen(false)}
        onSelect={(option) => {
          if (option) setServiceType(option.label);
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
