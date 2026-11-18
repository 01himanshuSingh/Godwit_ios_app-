/**
 * Profile → Payments.
 *
 * States:
 *   boot loading → PaymentsSkeleton
 *   scope/auth   → PaymentsExceptionCard (full screen)
 *   ready        → hero + tabs; each tab has own loading / exception / list + pagination
 *
 * Never invents balances; never surfaces adminId / clientId / raw DB errors.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AmountDueCard } from '@/features/profile/payments/components/AmountDueCard';
import { CreditsAndRefundsListCard } from '@/features/profile/payments/components/CreditsAndRefundsListCard';
import { InvoicesListCard } from '@/features/profile/payments/components/InvoicesListCard';
import { PaymentsExceptionCard } from '@/features/profile/payments/components/PaymentsExceptionCard';
import { PaymentsReceivedListCard } from '@/features/profile/payments/components/PaymentsReceivedListCard';
import { PaymentsSkeleton } from '@/features/profile/payments/components/PaymentsSkeleton';
import {
  PaymentsTabs,
  type PaymentsTabId,
} from '@/features/profile/payments/components/PaymentsTabs';
import { UpcomingPaymentsListCard } from '@/features/profile/payments/components/UpcomingPaymentsListCard';
import {
  classifyPaymentsLoadError,
  getClientCreditsAndRefundsPage,
  getClientInvoicesPage,
  getClientPaymentsCardSafe,
  getClientPaymentsReceivedPage,
  getClientUpcomingPaymentsSafe,
  mapPaymentsLoadErrorToMessage,
  type CreditRefundItem,
  type CreditsRefundsPageCursor,
  type ClientInvoiceItem,
  type InvoicesPageCursor,
  type PaymentReceivedItem,
  type PaymentsLoadErrorKind,
  type PaymentsReceivedPageCursor,
  type UpcomingPaymentItem,
} from '@/lib/firebase/payments';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const UPCOMING_PAGE_SIZE = 10;

type TabException = {
  kind: PaymentsLoadErrorKind;
  message: string;
  canRetry: boolean;
};

function earliestUpcomingIso(items: UpcomingPaymentItem[]): string | null {
  let earliest: Date | null = null;
  for (const item of items) {
    if (!item.date || Number.isNaN(item.date.getTime())) continue;
    if (!earliest || item.date.getTime() < earliest.getTime()) {
      earliest = item.date;
    }
  }
  if (!earliest) return null;
  const y = earliest.getFullYear();
  const m = String(earliest.getMonth() + 1).padStart(2, '0');
  const day = String(earliest.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toException(error: unknown, fallbackMessage: string): TabException {
  const kind = classifyPaymentsLoadError(error);
  const mapped = mapPaymentsLoadErrorToMessage(error);
  return {
    kind,
    message: mapped || fallbackMessage,
    canRetry: kind !== 'missing_scope' && kind !== 'auth',
  };
}

export function PaymentsScreen() {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() ?? '';
  const clientId = profile?.clientId?.trim() ?? '';
  const hasScope = Boolean(adminId && clientId);
  const ready = !isHydrating && hasScope;
  const [activeTab, setActiveTab] = useState<PaymentsTabId>('upcoming');
  const [upcomingVisibleCount, setUpcomingVisibleCount] = useState(UPCOMING_PAGE_SIZE);
  const [upcomingResetKey, setUpcomingResetKey] = useState('');
  const [visitedTabs, setVisitedTabs] = useState<Record<PaymentsTabId, boolean>>({
    upcoming: true,
    invoices: false,
    received: false,
    credits: false,
  });

  const selectTab = (next: PaymentsTabId) => {
    setActiveTab(next);
    setVisitedTabs((prev) => (prev[next] ? prev : { ...prev, [next]: true }));
  };

  const paymentsQuery = useQuery({
    queryKey: ['profile', 'payments', 'amount-due', adminId, clientId],
    queryFn: () => getClientPaymentsCardSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const upcomingQuery = useQuery({
    queryKey: ['profile', 'payments', 'upcoming', adminId, clientId],
    queryFn: () => getClientUpcomingPaymentsSafe(adminId, clientId),
    enabled: ready && (activeTab === 'upcoming' || visitedTabs.upcoming),
    retry: 2,
  });

  const invoicesQuery = useInfiniteQuery({
    queryKey: ['profile', 'payments', 'invoices', 'infinite', adminId, clientId],
    initialPageParam: null as InvoicesPageCursor,
    queryFn: async ({ pageParam }) => getClientInvoicesPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last?.hasMore ? last.nextCursor : undefined),
    enabled: ready && (activeTab === 'invoices' || visitedTabs.invoices),
    retry: 2,
  });

  const receivedQuery = useInfiniteQuery({
    queryKey: ['profile', 'payments', 'received', 'infinite', adminId, clientId],
    initialPageParam: null as PaymentsReceivedPageCursor,
    queryFn: async ({ pageParam }) => getClientPaymentsReceivedPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last?.hasMore ? last.nextCursor : undefined),
    enabled: ready && (activeTab === 'received' || visitedTabs.received),
    retry: 2,
  });

  const creditsQuery = useInfiniteQuery({
    queryKey: ['profile', 'payments', 'credits-refunds', 'infinite', adminId, clientId],
    initialPageParam: null as CreditsRefundsPageCursor,
    queryFn: async ({ pageParam }) => getClientCreditsAndRefundsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last?.hasMore ? last.nextCursor : undefined),
    enabled: ready && (activeTab === 'credits' || visitedTabs.credits),
    retry: 2,
  });

  const {
    hasNextPage: invoicesHasNextPage,
    isFetchingNextPage: invoicesIsFetchingNextPage,
    isPending: invoicesIsPending,
    isError: invoicesIsError,
    isFetching: invoicesIsFetching,
    fetchNextPage: fetchNextInvoicesPage,
    refetch: refetchInvoices,
  } = invoicesQuery;

  const {
    hasNextPage: receivedHasNextPage,
    isFetchingNextPage: receivedIsFetchingNextPage,
    isPending: receivedIsPending,
    isError: receivedIsError,
    isFetching: receivedIsFetching,
    fetchNextPage: fetchNextReceivedPage,
    refetch: refetchReceived,
  } = receivedQuery;

  const {
    hasNextPage: creditsHasNextPage,
    isFetchingNextPage: creditsIsFetchingNextPage,
    isPending: creditsIsPending,
    isError: creditsIsError,
    isFetching: creditsIsFetching,
    fetchNextPage: fetchNextCreditsPage,
    refetch: refetchCredits,
  } = creditsQuery;

  const card = paymentsQuery.data?.card ?? null;
  const upcoming = upcomingQuery.data?.data ?? null;
  const upcomingItems = useMemo(() => upcoming?.items ?? [], [upcoming?.items]);

  // Reset client-side upcoming window when scope/list size changes (render-time adjust).
  const nextUpcomingResetKey = `${adminId}:${clientId}:${upcomingItems.length}`;
  if (nextUpcomingResetKey !== upcomingResetKey) {
    setUpcomingResetKey(nextUpcomingResetKey);
    setUpcomingVisibleCount(UPCOMING_PAGE_SIZE);
  }

  const visibleUpcoming = useMemo(
    () => upcomingItems.slice(0, upcomingVisibleCount),
    [upcomingItems, upcomingVisibleCount],
  );
  const hasMoreUpcoming = upcomingVisibleCount < upcomingItems.length;

  const invoices = useMemo(() => {
    const pages = invoicesQuery.data?.pages;
    const merged = Array.isArray(pages)
      ? pages.flatMap((p) => (Array.isArray(p?.invoices) ? p.invoices : []))
      : [];
    const byId = new Map<string, ClientInvoiceItem>();
    for (const item of merged) {
      byId.set(item.saleId, item);
    }
    return [...byId.values()].sort((a, b) =>
      String(b.issuedAtKey || '').localeCompare(String(a.issuedAtKey || '')),
    );
  }, [invoicesQuery.data]);

  const received = useMemo(() => {
    const pages = receivedQuery.data?.pages;
    const merged = Array.isArray(pages)
      ? pages.flatMap((p) => (Array.isArray(p?.items) ? p.items : []))
      : [];
    const byId = new Map<string, PaymentReceivedItem>();
    for (const item of merged) {
      byId.set(item.entryId || `${item.amountLabel}-${item.subtitle}`, item);
    }
    return [...byId.values()].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }, [receivedQuery.data]);

  const credits = useMemo(() => {
    const pages = creditsQuery.data?.pages;
    const merged = Array.isArray(pages)
      ? pages.flatMap((p) => (Array.isArray(p?.items) ? p.items : []))
      : [];
    const byId = new Map<string, CreditRefundItem>();
    for (const item of merged) {
      byId.set(item.entryId || `${item.amountLabel}-${item.subtitle}`, item);
    }
    return [...byId.values()].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }, [creditsQuery.data]);

  const nextPaymentDue = useMemo(() => {
    if (card?.nextPaymentDue) return card.nextPaymentDue;
    return earliestUpcomingIso(upcomingItems);
  }, [card, upcomingItems]);

  useEffect(() => {
    if (
      activeTab !== 'received' ||
      received.length > 0 ||
      !receivedHasNextPage ||
      receivedIsFetchingNextPage ||
      receivedIsPending ||
      receivedIsError
    ) {
      return;
    }
    void fetchNextReceivedPage();
  }, [
    activeTab,
    received.length,
    receivedHasNextPage,
    receivedIsFetchingNextPage,
    receivedIsPending,
    receivedIsError,
    fetchNextReceivedPage,
  ]);

  useEffect(() => {
    if (
      activeTab !== 'credits' ||
      credits.length > 0 ||
      !creditsHasNextPage ||
      creditsIsFetchingNextPage ||
      creditsIsPending ||
      creditsIsError
    ) {
      return;
    }
    void fetchNextCreditsPage();
  }, [
    activeTab,
    credits.length,
    creditsHasNextPage,
    creditsIsFetchingNextPage,
    creditsIsPending,
    creditsIsError,
    fetchNextCreditsPage,
  ]);

  const screenException = useMemo(() => {
    if (!isHydrating && !hasScope) {
      return toException(new Error('Missing adminId or clientId'), 'Account details are missing.');
    }
    return null;
  }, [isHydrating, hasScope]);

  const heroException = useMemo(() => {
    if (!ready) return null;
    const raw =
      paymentsQuery.data?.errorMessage != null
        ? new Error(paymentsQuery.data.errorMessage)
        : paymentsQuery.isError
          ? paymentsQuery.error
          : null;
    if (!raw || card) return null;
    return toException(raw, 'Couldn’t load amount due.');
  }, [ready, paymentsQuery.data, paymentsQuery.isError, paymentsQuery.error, card]);

  const upcomingException = useMemo(() => {
    if (!ready || activeTab !== 'upcoming') return null;
    const raw =
      upcomingQuery.data?.errorMessage != null
        ? new Error(upcomingQuery.data.errorMessage)
        : upcomingQuery.isError
          ? upcomingQuery.error
          : null;
    if (!raw || upcomingItems.length > 0) return null;
    return toException(raw, 'Couldn’t load upcoming payments.');
  }, [
    ready,
    activeTab,
    upcomingQuery.data,
    upcomingQuery.isError,
    upcomingQuery.error,
    upcomingItems,
  ]);

  const invoicesException = useMemo(() => {
    if (!ready || activeTab !== 'invoices') return null;
    if (!invoicesIsError || invoices.length > 0) return null;
    return toException(invoicesQuery.error, 'Couldn’t load invoices.');
  }, [ready, activeTab, invoicesIsError, invoices.length, invoicesQuery.error]);

  const receivedException = useMemo(() => {
    if (!ready || activeTab !== 'received') return null;
    if (!receivedIsError || received.length > 0) return null;
    return toException(receivedQuery.error, 'Couldn’t load payments received.');
  }, [ready, activeTab, receivedIsError, received.length, receivedQuery.error]);

  const creditsException = useMemo(() => {
    if (!ready || activeTab !== 'credits') return null;
    if (!creditsIsError || credits.length > 0) return null;
    return toException(creditsQuery.error, 'Couldn’t load credits and refunds.');
  }, [ready, activeTab, creditsIsError, credits.length, creditsQuery.error]);

  const invoicesScanning =
    invoices.length === 0 &&
    Boolean(invoicesHasNextPage) &&
    !invoicesIsError &&
    (invoicesIsPending || invoicesIsFetchingNextPage);

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

  const bootLoading = isHydrating || (ready && paymentsQuery.isPending && !card && !heroException);

  const upcomingLoading =
    upcomingQuery.isPending && upcomingItems.length === 0 && !upcomingException;
  const invoicesLoading =
    invoicesIsPending && invoices.length === 0 && !invoicesException && !invoicesScanning;
  const receivedLoading =
    receivedIsPending && received.length === 0 && !receivedException && !receivedScanning;
  const creditsLoading =
    creditsIsPending && credits.length === 0 && !creditsException && !creditsScanning;

  const [upcomingPaging, setUpcomingPaging] = useState(false);

  const loadMoreUpcoming = () => {
    setUpcomingPaging(true);
    setUpcomingVisibleCount((n) => Math.min(n + UPCOMING_PAGE_SIZE, upcomingItems.length));
    requestAnimationFrame(() => setUpcomingPaging(false));
  };

  const showStickyChrome = !bootLoading && !screenException;

  const heroBlock = showStickyChrome ? (
    card ? (
      <AmountDueCard card={card} nextPaymentDue={nextPaymentDue} />
    ) : heroException ? (
      <PaymentsExceptionCard
        kind={heroException.kind}
        message={heroException.message}
        scope="screen"
        isRetrying={paymentsQuery.isFetching}
        onRetry={heroException.canRetry ? () => void paymentsQuery.refetch() : undefined}
      />
    ) : null
  ) : null;

  const tabsBlock = showStickyChrome ? (
    <View style={styles.tabsWrap}>
      <PaymentsTabs active={activeTab} onChange={selectTab} />
      <View style={styles.tabsBaseLine} />
    </View>
  ) : null;

  const tabBody = !showStickyChrome ? null : (
    <View style={styles.stack}>
      {activeTab === 'upcoming' ? (
        upcomingException ? (
          <PaymentsExceptionCard
            kind={upcomingException.kind}
            message={upcomingException.message}
            scope="upcoming"
            isRetrying={upcomingQuery.isFetching}
            onRetry={upcomingException.canRetry ? () => void upcomingQuery.refetch() : undefined}
          />
        ) : upcomingLoading ? (
          <PaymentsSkeleton tabOnly />
        ) : (
          <UpcomingPaymentsListCard
            items={visibleUpcoming}
            hasDue={upcoming?.hasDue}
            hasMore={hasMoreUpcoming}
            isLoading={upcomingLoading}
            isFetchingMore={upcomingPaging}
            onLoadMore={loadMoreUpcoming}
          />
        )
      ) : null}

      {activeTab === 'invoices' ? (
        invoicesException ? (
          <PaymentsExceptionCard
            kind={invoicesException.kind}
            message={invoicesException.message}
            scope="invoices"
            isRetrying={invoicesIsFetching}
            onRetry={invoicesException.canRetry ? () => void refetchInvoices() : undefined}
          />
        ) : invoicesLoading ? (
          <PaymentsSkeleton tabOnly />
        ) : (
          <InvoicesListCard
            invoices={invoices}
            hasMore={Boolean(invoicesHasNextPage)}
            isFetchingMore={invoicesIsFetchingNextPage}
            isLoading={invoicesLoading}
            isScanning={invoicesScanning}
            onLoadMore={() => void fetchNextInvoicesPage()}
          />
        )
      ) : null}

      {activeTab === 'received' ? (
        receivedException ? (
          <PaymentsExceptionCard
            kind={receivedException.kind}
            message={receivedException.message}
            scope="received"
            isRetrying={receivedIsFetching}
            onRetry={receivedException.canRetry ? () => void refetchReceived() : undefined}
          />
        ) : receivedLoading ? (
          <PaymentsSkeleton tabOnly />
        ) : (
          <PaymentsReceivedListCard
            items={received}
            hasMore={Boolean(receivedHasNextPage)}
            isFetchingMore={receivedIsFetchingNextPage}
            isLoading={receivedLoading}
            isScanning={receivedScanning}
            onLoadMore={() => void fetchNextReceivedPage()}
          />
        )
      ) : null}

      {activeTab === 'credits' ? (
        creditsException ? (
          <PaymentsExceptionCard
            kind={creditsException.kind}
            message={creditsException.message}
            scope="credits"
            isRetrying={creditsIsFetching}
            onRetry={creditsException.canRetry ? () => void refetchCredits() : undefined}
          />
        ) : creditsLoading ? (
          <PaymentsSkeleton tabOnly />
        ) : (
          <CreditsAndRefundsListCard
            items={credits}
            hasMore={Boolean(creditsHasNextPage)}
            isFetchingMore={creditsIsFetchingNextPage}
            isLoading={creditsLoading}
            isScanning={creditsScanning}
            onLoadMore={() => void fetchNextCreditsPage()}
          />
        )
      ) : null}
    </View>
  );

  return (
    <ProfileSectionShell
      title="Payments"
      subtitle="Everything owed to Godwit, and everything you have paid."
      layoutPreset="payments"
      titleTrailing={
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
        >
          <View style={styles.statementPill}>
            <Text style={styles.statementLabel}>Account / statement</Text>
          </View>
        </Pressable>
      }
      collapsibleBody={heroBlock}
      stickyHeader={tabsBlock}
    >
      {bootLoading ? <PaymentsSkeleton /> : null}

      {!bootLoading && screenException ? (
        <PaymentsExceptionCard
          kind={screenException.kind}
          message={screenException.message}
          scope="screen"
        />
      ) : null}

      {tabBody}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  statementPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statementLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.forest,
  },
  stack: {
    gap: 18,
  },
  tabsWrap: {
    gap: 0,
    backgroundColor: colors.background,
  },
  tabsBaseLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: -2,
  },
});
