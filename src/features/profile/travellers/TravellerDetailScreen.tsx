/**
 * Profile → Travellers → traveller detail.
 * Scope: admins/{adminId}/customers/{customerId}
 *
 * States:
 *   loading   → TravellerDetailSkeleton
 *   exception → TravellerDetailExceptionCard (auth / permission / offline / not_found / default)
 *   data      → hero + tabbed sections
 *
 * Never invents identity; never surfaces adminId / customerId / raw DB errors.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AirlinesCard } from '@/features/profile/travellers/components/AirlinesCard';
import { HotelsCard } from '@/features/profile/travellers/components/HotelsCard';
import { LoyaltyCard } from '@/features/profile/travellers/components/LoyaltyCard';
import { PersonalDetailsCard } from '@/features/profile/travellers/components/PersonalDetailsCard';
import { TravelDocumentsCard } from '@/features/profile/travellers/components/TravelDocumentsCard';
import { TravellerDetailExceptionCard } from '@/features/profile/travellers/components/TravellerDetailExceptionCard';
import { TravellerDetailHero } from '@/features/profile/travellers/components/TravellerDetailHero';
import { TravellerDetailSkeleton } from '@/features/profile/travellers/components/TravellerDetailSkeleton';
import {
  TravellerDetailTabs,
  type TravellerDetailTabId,
} from '@/features/profile/travellers/components/TravellerDetailTabs';
import {
  classifyTravellerDetailLoadError,
  getTravellerAirlinePrefsSafe,
  getTravellerHotelPrefsSafe,
  getTravellerLoyaltySafe,
  getTravellerPersonalDetailsSafe,
  getTravellerTravelDocsSafe,
  mapTravellerDetailLoadErrorToMessage,
  updateTravellerAirlinePref,
  updateTravellerHotelPref,
  type TravellerAirlinePrefField,
  type TravellerHotelPrefField,
} from '@/lib/firebase/customers';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerDetailScreenProps = {
  customerId: string;
};

export function TravellerDetailScreen({ customerId }: TravellerDetailScreenProps) {
  const queryClient = useQueryClient();
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() ?? '';
  const cid = customerId.trim();
  const hasScope = Boolean(adminId && cid);
  const [activeTab, setActiveTab] = useState<TravellerDetailTabId>('personal');

  const hotelsQueryKey = ['profile', 'traveller', 'hotels', adminId, cid] as const;
  const airlinesQueryKey = ['profile', 'traveller', 'airlines', adminId, cid] as const;

  const detailsQuery = useQuery({
    queryKey: ['profile', 'traveller', adminId, cid],
    queryFn: () => getTravellerPersonalDetailsSafe(adminId, cid),
    enabled: !isHydrating && hasScope,
    retry: 2,
  });

  const details = detailsQuery.data?.details ?? null;
  const travellerName = details?.fullName ?? null;
  const profileReady = !isHydrating && hasScope && detailsQuery.isSuccess && Boolean(details);

  const travelDocsQuery = useQuery({
    queryKey: ['profile', 'traveller', 'travel-docs', adminId, cid],
    queryFn: () => getTravellerTravelDocsSafe(adminId, cid),
    enabled: profileReady,
    retry: 2,
  });

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

  const hotelSaveMutation = useMutation({
    mutationFn: async ({ field, value }: { field: TravellerHotelPrefField; value: string }) => {
      await updateTravellerHotelPref(adminId, cid, field, value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: hotelsQueryKey });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to save hotel preference';
      Alert.alert('Unable to save', message);
    },
  });

  const airlinesQuery = useQuery({
    queryKey: airlinesQueryKey,
    queryFn: () => getTravellerAirlinePrefsSafe(adminId, cid),
    enabled: profileReady,
    retry: 2,
  });

  const airlineSaveMutation = useMutation({
    mutationFn: async ({ field, value }: { field: TravellerAirlinePrefField; value: string }) => {
      await updateTravellerAirlinePref(adminId, cid, field, value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: airlinesQueryKey });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to save airline preference';
      Alert.alert('Unable to save', message);
    },
  });

  const exception = useMemo(() => {
    if (!isHydrating && !hasScope) {
      const scopeError = new Error('Missing adminId or customerId');
      return {
        kind: classifyTravellerDetailLoadError(scopeError),
        message: mapTravellerDetailLoadErrorToMessage(scopeError),
        canRetry: false,
      };
    }

    const rawFromSafe =
      detailsQuery.data?.errorMessage != null ? new Error(detailsQuery.data.errorMessage) : null;
    const rawFromQuery = detailsQuery.isError ? detailsQuery.error : null;
    const raw = rawFromSafe ?? rawFromQuery;

    if (raw) {
      const kind = classifyTravellerDetailLoadError(raw);
      return {
        kind,
        message: mapTravellerDetailLoadErrorToMessage(raw),
        canRetry: kind !== 'missing_scope' && kind !== 'auth' && kind !== 'not_found',
      };
    }

    if (!detailsQuery.isPending && detailsQuery.isSuccess && !details) {
      const notFound = new Error('Traveller not found');
      return {
        kind: classifyTravellerDetailLoadError(notFound),
        message: mapTravellerDetailLoadErrorToMessage(notFound),
        canRetry: false,
      };
    }

    return null;
  }, [
    isHydrating,
    hasScope,
    detailsQuery.data,
    detailsQuery.isError,
    detailsQuery.error,
    detailsQuery.isPending,
    detailsQuery.isSuccess,
    details,
  ]);

  const loading = isHydrating || (hasScope && detailsQuery.isPending && !details && !exception);

  const travelDocs =
    travelDocsQuery.data?.travelDocs ??
    (details
      ? { customerId: cid, items: [], summaryLine: '0 on file · numbers always masked' }
      : null);

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

  const refetchAll = () => {
    void detailsQuery.refetch();
    void travelDocsQuery.refetch();
    void loyaltyQuery.refetch();
    void hotelsQuery.refetch();
    void airlinesQuery.refetch();
  };

  const isRetrying =
    detailsQuery.isFetching ||
    travelDocsQuery.isFetching ||
    loyaltyQuery.isFetching ||
    hotelsQuery.isFetching ||
    airlinesQuery.isFetching;

  return (
    <ProfileSectionShell backLabel="Travellers" layoutPreset="travellers">
      {loading ? <TravellerDetailSkeleton /> : null}

      {!loading && exception ? (
        <TravellerDetailExceptionCard
          kind={exception.kind}
          message={exception.message}
          isRetrying={isRetrying}
          onRetry={exception.canRetry ? refetchAll : undefined}
        />
      ) : null}

      {!loading && !exception && details ? (
        <View style={styles.stack}>
          <TravellerDetailHero fullName={details.fullName} relationship={details.relationship} />

          <View style={styles.tabsWrap}>
            <TravellerDetailTabs active={activeTab} onChange={setActiveTab} />
            <View style={styles.tabsBaseLine} />
          </View>

          {activeTab === 'personal' ? (
            <PersonalDetailsCard details={details} initiallyExpanded />
          ) : null}

          {activeTab === 'documents' ? (
            travelDocs ? (
              <TravelDocumentsCard travelDocs={travelDocs} initiallyExpanded />
            ) : (
              <Text style={styles.tabEmpty}>No travel documents available yet.</Text>
            )
          ) : null}

          {activeTab === 'loyalty' ? (
            loyalty ? (
              <LoyaltyCard loyalty={loyalty} initiallyExpanded />
            ) : (
              <Text style={styles.tabEmpty}>No loyalty details available yet.</Text>
            )
          ) : null}

          {activeTab === 'hotels' ? (
            hotelPrefs ? (
              <HotelsCard
                hotelPrefs={hotelPrefs}
                initiallyExpanded
                savingField={
                  hotelSaveMutation.isPending ? (hotelSaveMutation.variables?.field ?? null) : null
                }
                onSaveField={async (field, value) => {
                  await hotelSaveMutation.mutateAsync({ field, value });
                }}
              />
            ) : (
              <Text style={styles.tabEmpty}>No hotel preferences available yet.</Text>
            )
          ) : null}

          {activeTab === 'air' ? (
            airlinePrefs ? (
              <AirlinesCard
                airlinePrefs={airlinePrefs}
                initiallyExpanded
                savingField={
                  airlineSaveMutation.isPending
                    ? (airlineSaveMutation.variables?.field ?? null)
                    : null
                }
                onSaveField={async (field, value) => {
                  await airlineSaveMutation.mutateAsync({ field, value });
                }}
              />
            ) : (
              <Text style={styles.tabEmpty}>No airline preferences available yet.</Text>
            )
          ) : null}
        </View>
      ) : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  tabsWrap: {
    gap: 0,
  },
  tabsBaseLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: -2,
  },
  tabEmpty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
