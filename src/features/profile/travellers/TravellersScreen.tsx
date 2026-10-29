/**
 * Profile → Travellers list.
 * Scope: same adminId/clientId as Profile / Trips / Testing.
 */
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { TravellerListCard } from '@/features/profile/travellers/components/TravellerListCard';
import type { ClientTraveller } from '@/lib/firebase/customers';
import { getTravellersForClientSafe } from '@/lib/firebase/customers';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function TravellersScreen() {
  const router = useRouter();
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;

  const openTraveller = (traveller: ClientTraveller) => {
    const id = traveller.customerId?.trim();
    if (!id) return;
    router.push(`/profile/travellers/${encodeURIComponent(id)}`);
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['profile', 'travellers', adminId, clientId],
    queryFn: () => getTravellersForClientSafe(adminId, clientId),
    enabled: !isHydrating && Boolean(adminId && clientId),
    retry: 2,
  });

  const travellers = data?.travellers ?? [];
  const loadError = data?.errorMessage ?? (isError ? String(error) : null);
  const loading = isHydrating || (isPending && travellers.length === 0 && !loadError);

  return (
    <ProfileSectionShell
      title="Travellers"
      subtitle="Details, travel documents, loyalty and preferences."
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : null}

      {!loading && loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryLabel}>{isFetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !loadError ? (
        <TravellerListCard travellers={travellers} onPressTraveller={openTraveller} />
      ) : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
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
