/**
 * New request — pick a service starting point, then open the matching form.
 * Opened from Home → New request (in-tab so HomeTabBar stays visible).
 */
import { useCallback, useState } from 'react';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AirportVipRequestScreen } from '@/features/requests/airport-vip/AirportVipRequestScreen';
import { RequestServicesGrid } from '@/features/requests/components/RequestServicesGrid';
import type { RequestService, RequestServiceId } from '@/features/requests/data/requestServices';
import { ChauffeurRequestScreen } from '@/features/requests/chauffeur/ChauffeurRequestScreen';
import { FlightRequestScreen } from '@/features/requests/flight/FlightRequestScreen';
import { HotelRequestScreen } from '@/features/requests/hotel/HotelRequestScreen';
import { SomethingElseRequestScreen } from '@/features/requests/something-else/SomethingElseRequestScreen';
import { VillaRequestScreen } from '@/features/requests/villa/VillaRequestScreen';
import { YachtRequestScreen } from '@/features/requests/yacht/YachtRequestScreen';

const TAB_BAR_CLEARANCE = 96;

type ActiveRequestFormId = Extract<
  RequestServiceId,
  'hotel' | 'flight' | 'villa' | 'yacht' | 'chauffeur' | 'airportVip' | 'somethingElse'
>;

type RequestsScreenProps = {
  /** In-tab back handler; omit to use router.back() (stack route). */
  onBack?: () => void;
  /** Extra scroll inset so the grid clears the floating tab bar. */
  clearTabBar?: boolean;
};

export function RequestsScreen({ onBack, clearTabBar = false }: RequestsScreenProps) {
  const [activeServiceId, setActiveServiceId] = useState<ActiveRequestFormId | null>(null);

  const onSelectService = useCallback((service: RequestService) => {
    if (
      service.id === 'hotel' ||
      service.id === 'flight' ||
      service.id === 'villa' ||
      service.id === 'yacht' ||
      service.id === 'chauffeur' ||
      service.id === 'airportVip' ||
      service.id === 'somethingElse'
    ) {
      setActiveServiceId(service.id);
    }
  }, []);

  const onFormBack = useCallback(() => {
    setActiveServiceId(null);
  }, []);

  if (activeServiceId === 'hotel') {
    return <HotelRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  if (activeServiceId === 'flight') {
    return <FlightRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  if (activeServiceId === 'villa') {
    return <VillaRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  if (activeServiceId === 'yacht') {
    return <YachtRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  if (activeServiceId === 'chauffeur') {
    return <ChauffeurRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  if (activeServiceId === 'airportVip') {
    return <AirportVipRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  if (activeServiceId === 'somethingElse') {
    return <SomethingElseRequestScreen onBack={onFormBack} clearTabBar={clearTabBar} />;
  }

  return (
    <ProfileSectionShell
      title="What can we arrange?"
      subtitle="Choose a starting point. We'll take care of the detail."
      backLabel="Requests"
      onBack={onBack}
      contentBottomInset={clearTabBar ? TAB_BAR_CLEARANCE : 0}
    >
      <RequestServicesGrid onSelectService={onSelectService} />
    </ProfileSectionShell>
  );
}
