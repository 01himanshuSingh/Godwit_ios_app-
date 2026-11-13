/**
 * New request — pick a service starting point, then open the matching form.
 * HomeTabBar is suppressed for a full-screen responsive layout.
 */
import { useCallback, useState } from 'react';

import { useSuppressHomeTabBar } from '@/features/home/tabBar/HomeTabBarVisibility';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AirportVipRequestScreen } from '@/features/requests/airport-vip/AirportVipRequestScreen';
import { RequestServicesGrid } from '@/features/requests/components/RequestServicesGrid';
import type { RequestService, RequestServiceId } from '@/features/requests/data/requestServices';
import { ChauffeurRequestScreen } from '@/features/requests/chauffeur/ChauffeurRequestScreen';
import { FlightRequestScreen } from '@/features/requests/flight/FlightRequestScreen';
import { HotelRequestScreen } from '@/features/requests/hotel/HotelRequestScreen';
import { PrivateJetRequestScreen } from '@/features/requests/private-jet/PrivateJetRequestScreen';
import { SomethingElseRequestScreen } from '@/features/requests/something-else/SomethingElseRequestScreen';
import { VillaRequestScreen } from '@/features/requests/villa/VillaRequestScreen';
import { YachtRequestScreen } from '@/features/requests/yacht/YachtRequestScreen';

type ActiveRequestFormId = RequestServiceId;

type RequestsScreenProps = {
  /** In-tab back handler; omit to use router.back() (stack route). */
  onBack?: () => void;
  /** @deprecated Tab bar is suppressed on this screen — clearance unused. */
  clearTabBar?: boolean;
};

export function RequestsScreen({ onBack }: RequestsScreenProps) {
  useSuppressHomeTabBar(true);
  const [activeServiceId, setActiveServiceId] = useState<ActiveRequestFormId | null>(null);

  const onSelectService = useCallback((service: RequestService) => {
    setActiveServiceId(service.id);
  }, []);

  const onFormBack = useCallback(() => {
    setActiveServiceId(null);
  }, []);

  if (activeServiceId === 'hotel') {
    return <HotelRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'flight') {
    return <FlightRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'privateJet') {
    return <PrivateJetRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'villa') {
    return <VillaRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'yacht') {
    return <YachtRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'chauffeur') {
    return <ChauffeurRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'airportVip') {
    return <AirportVipRequestScreen onBack={onFormBack} />;
  }

  if (activeServiceId === 'somethingElse') {
    return <SomethingElseRequestScreen onBack={onFormBack} />;
  }

  return (
    <ProfileSectionShell
      title="What can we arrange?"
      subtitle="Choose a starting point. We'll take care of the detail."
      backLabel="Requests"
      onBack={onBack}
      layoutPreset="requests"
    >
      <RequestServicesGrid onSelectService={onSelectService} />
    </ProfileSectionShell>
  );
}
