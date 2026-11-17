import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useHomeTabBarScrollProps } from '@/features/home/tabBar/HomeTabBarVisibility';
import { TripsEmptyCard } from '@/features/trips/components/TripsEmptyCard';
import { TripsScreenSkeleton } from '@/features/trips/components/TripsScreenSkeleton';
import { UpcomingDayCard } from '@/features/trips/components/UpcomingDayCard';
import {
  buildUpcomingDayGroups,
  type UpcomingDayGroup,
} from '@/features/trips/utils/upcomingTripsUi';
import {
  getClientUpcomingSalesPage,
  sortClientSaleTripsAsc,
  type ClientSaleTrip,
  type SalesPageCursor,
  type TripsListMode,
} from '@/lib/firebase/sales/getClientUpcomingSales';
import { mapTripsLoadErrorToMessage } from '@/lib/firebase/sales/mapTripsLoadError';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

/** Clears floating Home tab bar so last rows can scroll fully into view. */
const TAB_BAR_CLEARANCE = 96;

type UpcomingTripsListProps = {
  adminId: string;
  clientId: string;
  /** upcoming | current | past — yacht dated before today appears under past. */
  mode?: TripsListMode;
  onTripPress?: (trip: ClientSaleTrip) => void;
  onNewRequest?: () => void;
};

type PageResult = {
  upcoming: ClientSaleTrip[];
  nextCursor: SalesPageCursor;
  hasMore: boolean;
};

export function UpcomingTripsList({
  adminId,
  clientId,
  mode = 'upcoming',
  onTripPress,
  onNewRequest,
}: UpcomingTripsListProps) {
  const tabBarScroll = useHomeTabBarScrollProps();
  const canFetch = Boolean(adminId.trim() && clientId.trim());
  const {
    data,
    error,
    isPending,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['trips', 'sales', mode, adminId, clientId],
    initialPageParam: null as SalesPageCursor,
    enabled: canFetch,
    queryFn: async ({ pageParam }): Promise<PageResult> =>
      getClientUpcomingSalesPage(adminId, clientId, pageParam, {
        mode,
        includeCurrent: mode === 'upcoming',
        includeCancelled: false,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });

  const trips = useMemo(() => {
    const merged = data?.pages.flatMap((p) => p.upcoming) ?? [];
    const byId = new Map<string, ClientSaleTrip>();
    for (const trip of merged) {
      byId.set(trip.saleId, trip);
    }
    return sortClientSaleTripsAsc([...byId.values()]);
  }, [data]);

  const dayGroups = useMemo(() => buildUpcomingDayGroups(trips), [trips]);

  useEffect(() => {
    if (
      canFetch &&
      dayGroups.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isPending &&
      !isError
    ) {
      void fetchNextPage();
    }
  }, [
    canFetch,
    dayGroups.length,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    fetchNextPage,
  ]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: UpcomingDayGroup }) => (
      <UpcomingDayCard group={item} onTripPress={onTripPress} />
    ),
    [onTripPress],
  );

  if (!canFetch) {
    return (
      <Text style={styles.empty}>
        Account details are missing. Please sign in again to see your trips.
      </Text>
    );
  }

  if (isPending || (dayGroups.length === 0 && hasNextPage)) {
    return <TripsScreenSkeleton />;
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyInline}>{mapTripsLoadErrorToMessage(error)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading trips"
          onPress={() => void refetch()}
          style={styles.retry}
        >
          <Text style={styles.retryLabel}>{isFetching ? 'Retrying…' : 'Retry'}</Text>
        </Pressable>
      </View>
    );
  }

  if (dayGroups.length === 0) {
    return <TripsEmptyCard mode={mode} onNewRequest={onNewRequest} />;
  }

  return (
    <FlashList
      data={dayGroups}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      onScroll={tabBarScroll.onScroll}
      scrollEventThrottle={tabBarScroll.scrollEventThrottle}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={() => void refetch()}
          tintColor={colors.forest}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator color={colors.forest} style={styles.footerLoader} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  centered: {
    flex: 1,
    paddingTop: 48,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: 24,
  },
  emptyInline: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
  footerLoader: {
    marginVertical: 20,
  },
});
