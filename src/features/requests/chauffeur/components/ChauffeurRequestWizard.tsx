/**
 * Chauffeur New request — Trip · Passengers · Notes · Review wizard.
 */
import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DateTimeFieldPicker } from '@/features/requests/components/DateTimeFieldPicker';
import { CHAUFFEUR_SERVICE_TYPE_OPTIONS } from '@/features/requests/data/requestInventory';
import { mapChauffeurFormToAppRequest } from '@/features/requests/chauffeur/mapChauffeurFormToAppRequest';
import { useSubmitServiceRequest } from '@/features/requests/hooks/useSubmitServiceRequest';
import { DEFAULT_PARTY_SIZE, ensureMinPartySize } from '@/features/requests/shared/travellerCounts';
import {
  requireDateTimeOnOrAfterNow,
  requireEndOnOrAfterStart,
  requirePositiveCount,
  requireText,
} from '@/features/requests/shared/validateRequestForm';
import {
  CountFieldRow,
  FieldBlock,
  NotesTabContent,
  ReviewTabContent,
  TapField,
  useWizardFieldStyles,
} from '@/features/requests/wizard/fields/WizardFields';
import { RequestSuccessView } from '@/features/requests/wizard/RequestSuccessView';
import { RequestWizardShell } from '@/features/requests/wizard/RequestWizardShell';
import { OptionListSheet } from '@/features/requests/wizard/sheets/OptionListSheet';
import { PlaceSearchSheet } from '@/features/requests/wizard/sheets/PlaceSearchSheet';
import { SummarySheet } from '@/features/requests/wizard/sheets/SummarySheet';
import type {
  WizardSummaryRow,
  WizardTabConfig,
  WizardTabId,
} from '@/features/requests/wizard/types';

const NOTE_CHIPS = [
  'Child seat',
  'Meet & greet',
  'Extra luggage',
  'Quiet ride',
  'Multilingual driver',
] as const;

type ChauffeurRequestWizardProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

function needsDropOff(serviceType: string): boolean {
  return serviceType.trim().toLowerCase().includes('airport');
}

type PlaceTarget = 'city' | 'pickUp' | 'dropOff' | null;

export function ChauffeurRequestWizard({ onBack, clearTabBar }: ChauffeurRequestWizardProps) {
  const styles = useWizardFieldStyles();
  const { submitting, submitRequest } = useSubmitServiceRequest();
  const [tab, setTab] = useState<WizardTabId>('details');
  const [successId, setSuccessId] = useState<string | null>(null);

  const [city, setCity] = useState('');
  const [cityPlaceId, setCityPlaceId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState('Airport Arrival');
  const [pickUp, setPickUp] = useState('');
  const [pickUpPlaceId, setPickUpPlaceId] = useState<string | null>(null);
  const [dropOff, setDropOff] = useState('');
  const [dropOffPlaceId, setDropOffPlaceId] = useState<string | null>(null);
  const [pickUpAt, setPickUpAt] = useState<Date | null>(null);
  const [returnAt, setReturnAt] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState(DEFAULT_PARTY_SIZE);
  const [notes, setNotes] = useState('');
  const [chips, setChips] = useState<string[]>([]);

  const [placeTarget, setPlaceTarget] = useState<PlaceTarget>(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<WizardTabId, boolean>>>({});

  const dropRequired = needsDropOff(serviceType);

  const tabs: WizardTabConfig[] = useMemo(
    () => [
      { id: 'details', label: 'Trip' },
      { id: 'travellers', label: 'Passengers' },
      { id: 'notes', label: 'Notes' },
      { id: 'review', label: 'Review' },
    ],
    [],
  );

  const tripValid = useMemo(() => {
    if (requireText(city, 'City')) return false;
    if (requireText(serviceType, 'Service type', { minLength: 1 })) return false;
    if (requireText(pickUp, 'Pick-up')) return false;
    if (dropRequired && requireText(dropOff, 'Drop-off location')) return false;
    if (requireDateTimeOnOrAfterNow(pickUpAt, 'Pick-up date & time')) return false;
    if (returnAt && requireEndOnOrAfterStart(pickUpAt, returnAt, 'Return', 'Pick-up')) return false;
    return true;
  }, [city, dropOff, dropRequired, pickUp, pickUpAt, returnAt, serviceType]);

  const passengersValid = useMemo(
    () => !requirePositiveCount(passengers, 'Number of passengers'),
    [passengers],
  );

  const completed = useMemo(
    () => ({
      details: Boolean(confirmed.details) && tripValid,
      travellers:
        Boolean(confirmed.details || confirmed.travellers) && tripValid && passengersValid,
      notes: Boolean(confirmed.notes),
      review: false,
    }),
    [confirmed.details, confirmed.notes, confirmed.travellers, passengersValid, tripValid],
  );

  const disabledTabs = useMemo(() => ({ review: !tripValid }), [tripValid]);

  const summaryPrimary = city || 'Add trip details';
  const summarySecondary = [
    serviceType || null,
    `${passengers} passenger${passengers === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const summaryRows: WizardSummaryRow[] = useMemo(
    () => [
      { id: 'city', label: 'CITY', value: city, icon: 'pin' },
      { id: 'service', label: 'SERVICE TYPE', value: serviceType, icon: 'car' },
      { id: 'pickup', label: 'PICK-UP', value: pickUp, icon: 'pin' },
      { id: 'dropoff', label: 'DROP-OFF', value: dropOff, icon: 'pin' },
      {
        id: 'when',
        label: 'PICK-UP TIME',
        value: pickUpAt ? format(pickUpAt, 'd MMM yyyy · h:mm a') : '',
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
    [chips, city, dropOff, notes, passengers, pickUp, pickUpAt, serviceType],
  );

  const completedSections = [
    completed.details,
    completed.travellers,
    completed.notes,
    tripValid,
  ].filter(Boolean).length;

  const validateTrip = useCallback(() => {
    const next: Record<string, string> = {};
    const cityErr = requireText(city, 'City');
    const typeErr = requireText(serviceType, 'Service type', { minLength: 1 });
    const pickErr = requireText(pickUp, 'Pick-up');
    const dropErr = dropRequired ? requireText(dropOff, 'Drop-off location') : null;
    const whenErr = requireDateTimeOnOrAfterNow(pickUpAt, 'Pick-up date & time');
    const retErr = returnAt
      ? requireEndOnOrAfterStart(pickUpAt, returnAt, 'Return', 'Pick-up')
      : null;
    if (cityErr) next.city = cityErr;
    if (typeErr) next.serviceType = typeErr;
    if (pickErr) next.pickUp = pickErr;
    if (dropErr) next.dropOff = dropErr;
    if (whenErr) next.pickUpAt = whenErr;
    if (retErr) next.returnAt = retErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [city, dropOff, dropRequired, pickUp, pickUpAt, returnAt, serviceType]);

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
      mapChauffeurFormToAppRequest({
        city,
        cityPlaceId,
        serviceType,
        pickUp,
        pickUpPlaceId,
        dropOff,
        dropOffPlaceId,
        pickUpAt,
        returnAt,
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
    city,
    cityPlaceId,
    dropOff,
    dropOffPlaceId,
    notes,
    passengers,
    pickUp,
    pickUpAt,
    pickUpPlaceId,
    returnAt,
    serviceType,
    submitRequest,
    tab,
    acceptPassengers,
    validateTrip,
  ]);

  if (successId) {
    return (
      <RequestSuccessView referenceId={successId} onViewRequest={onBack} onNewRequest={onBack} />
    );
  }

  return (
    <>
      <RequestWizardShell
        title="Chauffeur"
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
              <TapField value={city} placeholder="London" onPress={() => setPlaceTarget('city')} />
            </FieldBlock>
            <FieldBlock label="SERVICE TYPE" tag="REQUIRED" error={errors.serviceType}>
              <TapField
                value={serviceType}
                placeholder="Select service"
                onPress={() => setServiceOpen(true)}
              />
            </FieldBlock>
            <FieldBlock label="PICK-UP" tag="REQUIRED" error={errors.pickUp}>
              <TapField
                value={pickUp}
                placeholder="Address or airport"
                onPress={() => setPlaceTarget('pickUp')}
              />
            </FieldBlock>
            <FieldBlock
              label="DROP-OFF"
              tag={dropRequired ? 'REQUIRED' : 'Optional'}
              error={errors.dropOff}
            >
              <TapField
                value={dropOff}
                placeholder="Destination"
                onPress={() => setPlaceTarget('dropOff')}
              />
            </FieldBlock>
            <DateTimeFieldPicker
              label="PICK-UP DATE & TIME"
              value={pickUpAt}
              onChange={setPickUpAt}
              placeholder="Select date & time"
              mode="datetime"
              error={errors.pickUpAt}
            />
            <DateTimeFieldPicker
              label="RETURN DATE & TIME"
              value={returnAt}
              onChange={setReturnAt}
              placeholder="Optional"
              mode="datetime"
              error={errors.returnAt}
            />
          </View>
        ) : null}

        {tab === 'travellers' ? (
          <View style={styles.stack}>
            <CountFieldRow
              label="NUMBER OF PASSENGERS"
              helper="How many people will travel?"
              value={passengers}
              onChange={setPassengers}
              min={1}
              max={20}
              error={errors.passengers}
            />
          </View>
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
            infoText="Your chauffeur brief is shared with the driver ahead of pick-up."
          />
        ) : null}

        {tab === 'review' ? <ReviewTabContent rows={summaryRows} onEdit={setTab} /> : null}
      </RequestWizardShell>

      <PlaceSearchSheet
        visible={placeTarget === 'city'}
        title="City"
        placeholder="London"
        placeType="cities"
        initialQuery={city}
        onClose={() => setPlaceTarget(null)}
        onSelect={(place) => {
          setCity(place.mainText);
          setCityPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <PlaceSearchSheet
        visible={placeTarget === 'pickUp'}
        title="Pick-up"
        placeholder="Address or airport"
        placeType="geocode"
        initialQuery={pickUp}
        onClose={() => setPlaceTarget(null)}
        onSelect={(place) => {
          setPickUp(place.mainText);
          setPickUpPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <PlaceSearchSheet
        visible={placeTarget === 'dropOff'}
        title="Drop-off"
        placeholder="Destination"
        placeType="geocode"
        initialQuery={dropOff}
        onClose={() => setPlaceTarget(null)}
        onSelect={(place) => {
          setDropOff(place.mainText);
          setDropOffPlaceId('placeId' in place ? place.placeId : null);
        }}
      />
      <OptionListSheet
        visible={serviceOpen}
        title="Service type"
        options={CHAUFFEUR_SERVICE_TYPE_OPTIONS}
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
