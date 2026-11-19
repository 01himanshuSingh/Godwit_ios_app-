/**
 * Profile → Travellers list.
 *
 * States:
 *   boot      → ScreenBootLoader (Godwit bird)
 *   exception → TravellersExceptionCard
 *   empty     → TravellersEmptyCard
 *   data      → TravellerListCard
 *
 * Never invents travellers; never surfaces adminId / clientId / raw DB errors.
 */
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { TravellerListCard } from '@/features/profile/travellers/components/TravellerListCard';
import { TravellersEmptyCard } from '@/features/profile/travellers/components/TravellersEmptyCard';
import { TravellersExceptionCard } from '@/features/profile/travellers/components/TravellersExceptionCard';
import type { ClientTraveller } from '@/lib/firebase/customers';
import {
  classifyTravellersLoadError,
  getTravellersForClientSafe,
  mapTravellersLoadErrorToMessage,
} from '@/lib/firebase/customers';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { isScreenBooting, ScreenBootLoader } from '@/ui/loading';

export function TravellersScreen() {
  const router = useRouter();
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() ?? '';
  const clientId = profile?.clientId?.trim() ?? '';
  const hasScope = Boolean(adminId && clientId);

  const openTraveller = (traveller: ClientTraveller) => {
    const id = traveller.customerId?.trim();
    if (!id) return;
    router.push(`/profile/travellers/${encodeURIComponent(id)}`);
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['profile', 'travellers', adminId, clientId],
    queryFn: () => getTravellersForClientSafe(adminId, clientId),
    enabled: !isHydrating && hasScope,
    retry: 2,
  });

  const travellers = data?.travellers ?? [];

  const exception = useMemo(() => {
    if (isHydrating) return null;
    if (!hasScope) {
      return {
        kind: classifyTravellersLoadError(new Error('Missing adminId or clientId')),
        message: mapTravellersLoadErrorToMessage(new Error('Missing adminId or clientId')),
        canRetry: false,
      };
    }

    const raw = data?.errorMessage != null ? new Error(data.errorMessage) : isError ? error : null;

    if (!raw) return null;

    const kind = classifyTravellersLoadError(raw);
    return {
      kind,
      message: mapTravellersLoadErrorToMessage(raw),
      canRetry: kind !== 'missing_scope' && kind !== 'auth',
    };
  }, [isHydrating, hasScope, data, isError, error]);

  const loading = isScreenBooting({
    isHydrating,
    enabled: hasScope,
    isPending,
    hasContent: travellers.length > 0,
    hasTerminalError: Boolean(exception),
  });

  if (loading) {
    return <ScreenBootLoader accessibilityLabel="Loading travellers" />;
  }

  const showEmpty = !exception && travellers.length === 0;
  const showList = !exception && travellers.length > 0;

  return (
    <ProfileSectionShell
      title="Travellers"
      subtitle="Details, travel documents, loyalty and preferences."
      backLabel="Profile"
      layoutPreset="travellers"
    >
      {exception ? (
        <TravellersExceptionCard
          kind={exception.kind}
          message={exception.message}
          isRetrying={isFetching}
          onRetry={exception.canRetry ? () => void refetch() : undefined}
        />
      ) : null}

      {showEmpty ? <TravellersEmptyCard /> : null}

      {showList ? (
        <TravellerListCard travellers={travellers} onPressTraveller={openTraveller} />
      ) : null}
    </ProfileSectionShell>
  );
}
