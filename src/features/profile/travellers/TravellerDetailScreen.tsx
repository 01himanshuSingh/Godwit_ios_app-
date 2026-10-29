/**
 * Profile → Travellers → traveller detail.
 * Scope: admins/{adminId}/customers/{customerId}
 * Loyalty / Hotels: customerProfile under that traveller
 */
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AirlinesCard } from '@/features/profile/travellers/components/AirlinesCard';
import { HotelsCard } from '@/features/profile/travellers/components/HotelsCard';
import { LoyaltyCard } from '@/features/profile/travellers/components/LoyaltyCard';
import { PersonalDetailsCard } from '@/features/profile/travellers/components/PersonalDetailsCard';
import {
  getTravellerAirlinePrefsSafe,
  getTravellerHotelPrefsSafe,
  getTravellerLoyaltySafe,
  getTravellerPersonalDetailsSafe,
} from '@/lib/firebase/customers';

import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerDetailScreenProps = {
  customerId: string;
};

export function TravellerDetailScreen({ customerId }: TravellerDetailScreenProps) {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const cid = customerId.trim();

  const detailsQuery = useQuery({
    queryKey: ['profile', 'traveller', adminId, cid],
    queryFn: () => getTravellerPersonalDetailsSafe(adminId, cid),
    enabled: !isHydrating && Boolean(adminId && cid),
    retry: 2,
  });

  const details = detailsQuery.data?.details ?? null;
  const travellerName = details?.fullName ?? null;
  const profileReady = !isHydrating && Boolean(adminId && cid) && detailsQuery.isSuccess;

  const loyaltyQuery = useQuery({
    queryKey: ['profile', 'traveller', 'loyalty', adminId, cid, travellerName],
    queryFn: () => getTravellerLoyaltySafe(adminId, cid, travellerName),
    enabled: profileReady,
    retry: 2,
  });

  const hotelsQuery = useQuery({
    queryKey: ['profile', 'traveller', 'hotels', adminId, cid, travellerName],
    queryFn: () => getTravellerHotelPrefsSafe(adminId, cid, travellerName),
    enabled: profileReady,
    retry: 2,
  });

  const airlinesQuery = useQuery({
    queryKey: ['profile', 'traveller', 'airlines', adminId, cid],
    queryFn: () => getTravellerAirlinePrefsSafe(adminId, cid),
    enabled: profileReady,
    retry: 2,
  });

  const loadError =
    detailsQuery.data?.errorMessage ??
    (detailsQuery.isError ? String(detailsQuery.error) : null) ??
    (!detailsQuery.isPending && !details ? 'Traveller not found.' : null);
  const loading = isHydrating || (detailsQuery.isPending && !details && !loadError);

  const title = details?.fullName || 'Traveller';
  const subtitle = details?.relationship || null;

  const loyalty =
    loyaltyQuery.data?.loyalty ??
    (details ? { customerId: cid, rows: [], summaryLine: null } : null);

  const hotelPrefs =
    hotelsQuery.data?.hotelPrefs ??
    (details
      ? {
          customerId: cid,
          memberName: travellerName,
          preferredRoomType: null,
          preferredHotelBrands: null,
          specialRequests: null,
          hotelRewardMember: null,
          hotelMemberNumber: null,
          summaryLine: null,
        }
      : null);

  const airlinePrefs =
    airlinesQuery.data?.airlinePrefs ??
    (details
      ? {
          customerId: cid,
          preferredAirlines: null,
          specialMeal: null,
          seatPreference: null,
          airportVipRequirement: null,
          preferredClass: null,
          frequentFlyerMemberNumber: null,
          frequentFlyerActive: null,
          summaryLine: null,
        }
      : null);

  return (
    <ProfileSectionShell title={title} subtitle={subtitle} backLabel="Travellers">
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : null}

      {!loading && loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable
            onPress={() => {
              void detailsQuery.refetch();
              void loyaltyQuery.refetch();
              void hotelsQuery.refetch();
              void airlinesQuery.refetch();
            }}

            style={styles.retry}
          >
            <Text style={styles.retryLabel}>{detailsQuery.isFetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !loadError && details ? (
        <View style={styles.stack}>
          <PersonalDetailsCard details={details} initiallyExpanded />
          {loyalty ? <LoyaltyCard loyalty={loyalty} initiallyExpanded /> : null}
          {hotelPrefs ? <HotelsCard hotelPrefs={hotelPrefs} initiallyExpanded /> : null}
          {airlinePrefs ? <AirlinesCard airlinePrefs={airlinePrefs} initiallyExpanded /> : null}
        </View>
      ) : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  errorBox: {
    borderRadius: 16,
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
});
