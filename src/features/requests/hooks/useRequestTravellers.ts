import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { RequestTraveller } from '@/features/requests/data/mockRequestTravellers';
import { getTravellersForClientSafe } from '@/lib/firebase/customers/getTravellersForClient';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';

/**
 * Loads CRM travellers for the signed-in client (for WHO IS TRAVELLING).
 */
export function useRequestTravellers(): {
  travellers: RequestTraveller[];
  isLoading: boolean;
  errorMessage: string | null;
} {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() ?? '';
  const clientId = profile?.clientId?.trim() ?? '';

  const query = useQuery({
    queryKey: ['requests', 'travellers', adminId, clientId],
    queryFn: () => getTravellersForClientSafe(adminId, clientId),
    enabled: Boolean(adminId && clientId) && !isHydrating,
  });

  const travellers = useMemo<RequestTraveller[]>(() => {
    const list = query.data?.travellers ?? [];
    return list.map((t) => ({
      id: t.customerId,
      name: t.name.trim() || 'Traveller',
    }));
  }, [query.data?.travellers]);

  return {
    travellers,
    isLoading: isHydrating || query.isLoading,
    errorMessage: query.data?.errorMessage ?? null,
  };
}
