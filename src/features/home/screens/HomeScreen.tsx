import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { CurrentTripCard, CurrentTripEmptyCard } from '@/features/home/components/CurrentTripCard';
import { GreetingSection } from '@/features/home/components/GreetingSection';
import { GreetingUnavailableCard } from '@/features/home/components/GreetingUnavailableCard';
import { HomeQuickActions } from '@/features/home/components/HomeQuickActions';
import { HomeScreenSkeleton } from '@/features/home/components/HomeScreenSkeleton';
import { PaymentsDueCard } from '@/features/home/components/PaymentsDueCard';
import { useHomeTabBarScrollProps } from '@/features/home/tabBar/HomeTabBarVisibility';
import { RequestsScreen } from '@/features/requests';
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
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';
import { isScreenBooting, ScreenBootLoader } from '@/ui/loading';
import { colors } from '@/ui/tokens/colors';

const TAB_BAR_CLEARANCE = 24;

export function HomeScreen() {
  const router = useRouter();
  const fontsLoaded = useGodwitFonts();
  const { profile, isHydrating } = useActiveClientProfile();
  const [showRequests, setShowRequests] = useState(false);
  const tabBarScroll = useHomeTabBarScrollProps();

  /** Real magic-link session only — never fall back to a hardcoded test client. */
  const adminId = profile?.adminId?.trim() ?? '';
  const clientId = profile?.clientId?.trim() ?? '';
  const ready = !isHydrating && Boolean(adminId && clientId);
  const hasProfileName = Boolean(profile?.name?.trim());

  const handleNewRequest = useCallback(() => {
    setShowRequests(true);
  }, []);

  const handleRequestsBack = useCallback(() => {
    setShowRequests(false);
  }, []);

  const profileResolveQuery = useQuery({
    queryKey: ['home', 'resolve-profile', adminId, clientId],
    queryFn: () => getClientByAdminAndClientIdSafe(adminId, clientId),
    enabled: ready && !hasProfileName,
    retry: 1,
  });

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
  const tripLoadFailed = Boolean(currentTripQuery.data?.errorMessage) || currentTripQuery.isError;
  const paymentsDue = paymentsDueQuery.data?.card ?? null;

  const sessionHome = useMemo(() => {
    const name = profile?.name?.trim();
    if (!name) {
      return null;
    }

    return {
      familyName: familyLabelFromClientName(name).toUpperCase(),
      userName: getProfileFirstName(name),
      greeting: greetingForLocalTime(),
      profileInitials: getProfileInitial(name),
    };
  }, [profile]);

  const onViewTrip = useCallback(
    (primarySaleId: string) => {
      const saleId = primarySaleId.trim();
      const tripAdminId = profile?.adminId?.trim() || '';
      const tripClientId = profile?.clientId?.trim() || '';
      if (!saleId || !tripAdminId || !tripClientId) {
        return;
      }
      router.push({
        pathname: '/trips/[saleId]',
        params: {
          saleId,
          adminId: tripAdminId,
          clientId: tripClientId,
        },
      });
    },
    [router, profile],
  );

  const onViewPayments = useCallback(() => {
    router.push('/profile/payments');
  }, [router]);

  const paymentsLoading = ready && paymentsDueQuery.isPending && !paymentsDueQuery.data;
  /** Screen boot: fonts / session / first trip. Payments wait → skeleton below. */
  const startingLoad = isScreenBooting({
    fontsReady: fontsLoaded,
    isHydrating,
    enabled: ready,
    isPending: currentTripQuery.isPending,
    hasContent: Boolean(currentTripQuery.data),
    hasTerminalError: currentTripQuery.isError,
  });
  const hasIdentity = Boolean(sessionHome);

  if (showRequests) {
    return <RequestsScreen onBack={handleRequestsBack} />;
  }

  if (startingLoad) {
    return <ScreenBootLoader accessibilityLabel="Loading your Godwit home" />;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={tabBarScroll.onScroll}
      scrollEventThrottle={tabBarScroll.scrollEventThrottle}
    >
      {hasIdentity && sessionHome ? (
        <GreetingSection
          familyName={sessionHome.familyName}
          greeting={sessionHome.greeting}
          userName={sessionHome.userName}
          updatesCount={null}
        />
      ) : (
        <GreetingUnavailableCard
          isRetrying={profileResolveQuery.isFetching}
          onRetry={() => void profileResolveQuery.refetch()}
        />
      )}

      {currentTrip ? (
        <CurrentTripCard
          card={currentTrip}
          onViewTrip={(saleId) => {
            onViewTrip(saleId);
          }}
        />
      ) : (
        <CurrentTripEmptyCard
          variant={tripLoadFailed ? 'error' : 'empty'}
          onNewRequest={handleNewRequest}
        />
      )}

      <HomeQuickActions onNewRequest={handleNewRequest} onPayments={onViewPayments} />

      {paymentsLoading ? <HomeScreenSkeleton paymentsOnly /> : null}

      {!paymentsLoading && paymentsDue ? (
        <PaymentsDueCard card={paymentsDue} onViewPayments={onViewPayments} />
      ) : null}
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
});
