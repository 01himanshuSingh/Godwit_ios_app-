/**
 * Home trip spotlight — current cluster, else soonest upcoming.
 * Path: admins/{adminId}/clients/{clientId}/sales
 */

import { buildHomeTripSpotlightCard } from '@/lib/firebase/sales/currentTrip/buildClientCurrentTripCard';
import type { GetClientCurrentTripCardResult } from '@/lib/firebase/sales/currentTrip/currentTripCardTypes';
import { getClientSales } from '@/lib/firebase/sales/getClientUpcomingSales';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';

export async function getClientCurrentTripCard(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
) {
  const sales = await getClientSales(adminId, clientId);
  return buildHomeTripSpotlightCard(sales);
}

/** Alias — same fetch; name reflects current → upcoming fallback. */
export async function getHomeTripSpotlightCard(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
) {
  return getClientCurrentTripCard(adminId, clientId);
}

export async function getClientCurrentTripCardSafe(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<GetClientCurrentTripCardResult> {
  try {
    const card = await getClientCurrentTripCard(adminId, clientId);
    return { card, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load home trip card';
    console.error('[getClientCurrentTripCard]', error);
    return { card: null, errorMessage: message };
  }
}

export const getHomeTripSpotlightCardSafe = getClientCurrentTripCardSafe;
