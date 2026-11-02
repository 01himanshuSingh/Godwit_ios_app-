/**
 * Profile → Payments.
 * Amount due → upcoming payments → invoices → payments received → credits & refunds.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AmountDueCard } from '@/features/profile/payments/components/AmountDueCard';
import { CreditsAndRefundsListCard } from '@/features/profile/payments/components/CreditsAndRefundsListCard';
import { InvoicesListCard } from '@/features/profile/payments/components/InvoicesListCard';
import { PaymentsReceivedListCard } from '@/features/profile/payments/components/PaymentsReceivedListCard';
import { UpcomingPaymentsListCard } from '@/features/profile/payments/components/UpcomingPaymentsListCard';
import {
  getClientCreditsAndRefundsPage,
  getClientInvoicesSafe,
  getClientPaymentsCardSafe,
  getClientPaymentsReceivedPage,
  getClientUpcomingPaymentsSafe,
  mapPaymentsLoadErrorToMessage,
  type CreditRefundItem,
  type CreditsRefundsPageCursor,
  type PaymentReceivedItem,
  type PaymentsReceivedPageCursor,
} from '@/lib/firebase/payments';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function PaymentsScreen() {
  const { width } = useWindowDimensions();
  const actionSize = width < 360 ? 12 : 14;
  const actionLineHeight = width < 360 ? 16 : 20;

  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;
  const hasScope = Boolean(adminId && clientId);
  const ready = !isHydrating && hasScope;

  const paymentsQuery = useQuery({
    queryKey: ['profile', 'payments', 'amount-due', adminId, clientId],
    queryFn: () => getClientPaymentsCardSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const upcomingQuery = useQuery({
    queryKey: ['profile', 'payments', 'upcoming', adminId, clientId],
    queryFn: () => getClientUpcomingPaymentsSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const invoicesQuery = useQuery({
    queryKey: ['profile', 'payments', 'invoices', adminId, clientId],
    queryFn: () => getClientInvoicesSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const receivedQuery = useInfiniteQuery({
    queryKey: ['profile', 'payments', 'received', adminId, clientId],
    initialPageParam: null as PaymentsReceivedPageCursor,
    queryFn: async ({ pageParam }) => getClientPaymentsReceivedPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: ready,
    retry: 2,
  });

  const creditsQuery = useInfiniteQuery({
    queryKey: ['profile', 'payments', 'credits-refunds', adminId, clientId],
    initialPageParam: null as CreditsRefundsPageCursor,
    queryFn: async ({ pageParam }) => getClientCreditsAndRefundsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: ready,
    retry: 2,
  });

  const {
    hasNextPage: receivedHasNextPage,
    isFetchingNextPage: receivedIsFetchingNextPage,
    isPending: receivedIsPending,
    isError: receivedIsError,
    fetchNextPage: fetchNextReceivedPage,
  } = receivedQuery;

  const {
    hasNextPage: creditsHasNextPage,
    isFetchingNextPage: creditsIsFetchingNextPage,
    isPending: creditsIsPending,
    isError: creditsIsError,
    fetchNextPage: fetchNextCreditsPage,
  } = creditsQuery;

  const card = paymentsQuery.data?.card ?? null;
  const upcoming = upcomingQuery.data?.data ?? null;
  const upcomingItems = upcoming?.items ?? [];
  const invoices = invoicesQuery.data?.invoices ?? [];

  const received = useMemo(() => {
    const merged = receivedQuery.data?.pages.flatMap((p) => p.items) ?? [];
    const byId = new Map<string, PaymentReceivedItem>();
    for (const item of merged) {
      byId.set(item.entryId || `${item.amountLabel}-${item.subtitle}`, item);
    }
    return [...byId.values()].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }, [receivedQuery.data]);

  const credits = useMemo(() => {
    const merged = creditsQuery.data?.pages.flatMap((p) => p.items) ?? [];
    const byId = new Map<string, CreditRefundItem>();
    for (const item of merged) {
      byId.set(item.entryId || `${item.amountLabel}-${item.subtitle}`, item);
    }
    return [...byId.values()].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }, [creditsQuery.data]);

  useEffect(() => {
    if (
      received.length === 0 &&
      receivedHasNextPage &&
      !receivedIsFetchingNextPage &&
      !receivedIsPending &&
      !receivedIsError
    ) {
      void fetchNextReceivedPage();
    }
  }, [
    received.length,
    receivedHasNextPage,
    receivedIsFetchingNextPage,
    receivedIsPending,
    receivedIsError,
    fetchNextReceivedPage,
  ]);

  useEffect(() => {
    if (
      credits.length === 0 &&
      creditsHasNextPage &&
      !creditsIsFetchingNextPage &&
      !creditsIsPending &&
      !creditsIsError
    ) {
      void fetchNextCreditsPage();
    }
  }, [
    credits.length,
    creditsHasNextPage,
    creditsIsFetchingNextPage,
    creditsIsPending,
    creditsIsError,
    fetchNextCreditsPage,
  ]);

  const receivedScanning =
    received.length === 0 &&
    Boolean(receivedHasNextPage) &&
    !receivedIsError &&
    (receivedIsPending || receivedIsFetchingNextPage);

  const creditsScanning =
    credits.length === 0 &&
    Boolean(creditsHasNextPage) &&
    !creditsIsError &&
    (creditsIsPending || creditsIsFetchingNextPage);

  const loadError =
    (!isHydrating && !hasScope
      ? mapPaymentsLoadErrorToMessage(new Error('Missing adminId or clientId'))
      : null) ??
    paymentsQuery.data?.errorMessage ??
    upcomingQuery.data?.errorMessage ??
    invoicesQuery.data?.errorMessage ??
    (paymentsQuery.isError ? mapPaymentsLoadErrorToMessage(paymentsQuery.error) : null) ??
    (upcomingQuery.isError ? mapPaymentsLoadErrorToMessage(upcomingQuery.error) : null) ??
    (invoicesQuery.isError ? mapPaymentsLoadErrorToMessage(invoicesQuery.error) : null) ??
    (receivedIsError ? mapPaymentsLoadErrorToMessage(receivedQuery.error) : null) ??
    (creditsIsError ? mapPaymentsLoadErrorToMessage(creditsQuery.error) : null);

  const loading =
    isHydrating ||
    (hasScope &&
      (paymentsQuery.isPending ||
        upcomingQuery.isPending ||
        invoicesQuery.isPending ||
        receivedIsPending ||
        creditsIsPending) &&
      !card &&
      upcomingItems.length === 0 &&
      invoices.length === 0 &&
      received.length === 0 &&
      credits.length === 0 &&
      !loadError);

  const refetchAll = () => {
    void paymentsQuery.refetch();
    void upcomingQuery.refetch();
    void invoicesQuery.refetch();
    void receivedQuery.refetch();
    void creditsQuery.refetch();
  };

  const isRefetching =
    paymentsQuery.isFetching ||
    upcomingQuery.isFetching ||
    invoicesQuery.isFetching ||
    receivedQuery.isFetching ||
    creditsQuery.isFetching;

  return (
    <ProfileSectionShell
      title="Payments"
      subtitle="Everything owed to Godwit, and everything you have paid."
      subtitleTrailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account statement"
          hitSlop={8}
          onPress={() => {
            Alert.alert(
              'Account statement',
              'Your Godwit account statement will be available here soon.',
            );
          }}
          style={styles.statementHit}
        >
          <Text
            style={[styles.statementLabel, { fontSize: actionSize, lineHeight: actionLineHeight }]}
          >
            Account{'\n'}statement
          </Text>
        </Pressable>
      }
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : null}

      {!loading && loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={refetchAll} style={styles.retry}>
            <Text style={styles.retryLabel}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !loadError ? (
        <View style={styles.stack}>
          {card ? <AmountDueCard card={card} /> : null}
          <UpcomingPaymentsListCard items={upcomingItems} hasDue={upcoming?.hasDue} />
          <InvoicesListCard invoices={invoices} />
          <PaymentsReceivedListCard
            items={received}
            hasMore={Boolean(receivedHasNextPage)}
            isFetchingMore={receivedIsFetchingNextPage}
            isScanning={receivedScanning}
            onLoadMore={() => void fetchNextReceivedPage()}
          />
          <CreditsAndRefundsListCard
            items={credits}
            hasMore={Boolean(creditsHasNextPage)}
            isFetchingMore={creditsIsFetchingNextPage}
            isScanning={creditsScanning}
            onLoadMore={() => void fetchNextCreditsPage()}
          />
        </View>
      ) : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  statementHit: {
    alignItems: 'flex-end',
  },
  statementLabel: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    textAlign: 'right',
  },
  stack: {
    gap: 22,
  },
  centered: {
    paddingVertical: 28,
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
