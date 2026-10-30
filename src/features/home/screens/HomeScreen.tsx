import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { CurrentTripCard } from '@/features/home/components/CurrentTripCard';
import { GreetingSection } from '@/features/home/components/GreetingSection';
import { NewRequestButton } from '@/features/home/components/NewRequestButton';
import { PaymentsDueCard } from '@/features/home/components/PaymentsDueCard';
import { staticHomeViewModel } from '@/features/home/schemas/homeViewModel';
import { familyLabelFromClientName } from '@/lib/firebase/clients';
import { getHomePaymentsDueSafe } from '@/lib/firebase/payments';
import { getClientCurrentTripCardSafe } from '@/lib/firebase/sales/currentTrip';
import { getClientByAdminAndClientIdSafe } from '@/lib/firebase/testing/getClientByEmail';
import {
  getProfileFirstName,
  getProfileInitial,
  greetingForLocalTime,
} from '@/lib/session/activeClientProfile';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { colors } from '@/ui/tokens/colors';

const TAB_BAR_CLEARANCE = 96;

export function HomeScreen() {
  const router = useRouter();
  const fontsLoaded = useGodwitFonts();
  const { profile, isHydrating } = useActiveClientProfile();
  const homeData = staticHomeViewModel;

  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;
  const ready = !isHydrating && Boolean(adminId && clientId);

  const handleNewRequest = useCallback(() => {
    // Placeholder — wired to requests flow after auth/session.
  }, []);

  useEffect(() => {
    if (isHydrating || profile?.name.trim()) {
      return;
    }
    void getClientByAdminAndClientIdSafe();
  }, [isHydrating, profile]);

  const currentTripQuery = useQuery({
    queryKey: ['home', 'current-trip', adminId, clientId],
    queryFn: () => getClientCurrentTripCardSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const paymentsDueQuery = useQuery({
    queryKey: ['home', 'payments-due', adminId, clientId],
    queryFn: () => getHomePaymentsDueSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const currentTrip = currentTripQuery.data?.card ?? null;
  const paymentsDue = paymentsDueQuery.data?.card ?? null;

  const sessionHome = useMemo(() => {
    if (!profile?.name.trim()) {
      return null;
    }

    const firstName = getProfileFirstName(profile.name);
    const eyebrow = familyLabelFromClientName(profile.name).toUpperCase();

    return {
      familyName: eyebrow,
      userName: firstName,
      greeting: greetingForLocalTime(),
      profileInitials: getProfileInitial(profile.name),
    };
  }, [profile]);

  const onViewTrip = useCallback(
    (primarySaleId: string) => {
      router.push(`/trips/${encodeURIComponent(primarySaleId)}`);
    },
    [router],
  );

  const onViewPayments = useCallback(() => {
    router.push('/profile/payments');
  }, [router]);

  if (!fontsLoaded || isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  const familyName = sessionHome?.familyName ?? homeData.familyName;
  const userName = sessionHome?.userName ?? homeData.userName;
  const greeting = sessionHome?.greeting ?? homeData.greeting;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <GreetingSection
        familyName={familyName}
        greeting={greeting}
        userName={userName}
        updatesCount={homeData.updatesCount}
      />
      <NewRequestButton onPress={handleNewRequest} />

      {currentTripQuery.isPending && !currentTrip ? (
        <View style={styles.tripLoading}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : null}

      {currentTrip ? (
        <CurrentTripCard
          card={currentTrip}
          onViewTrip={(saleId) => {
            onViewTrip(saleId);
          }}
        />
      ) : null}

      {paymentsDue ? <PaymentsDueCard card={paymentsDue} onViewPayments={onViewPayments} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  tripLoading: {
    marginTop: 28,
    paddingVertical: 24,
    alignItems: 'center',
  },
});
