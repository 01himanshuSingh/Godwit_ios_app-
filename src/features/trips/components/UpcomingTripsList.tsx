import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

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
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingTripsListProps = {
  adminId: string;
  clientId: string;
  /** upcoming | current | past — yacht dated before today appears under past. */
  mode?: TripsListMode;
  onTripPress?: (trip: ClientSaleTrip) => void;
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
}: UpcomingTripsListProps) {
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
  } = useInfiniteQuery({
    queryKey: ['trips', 'sales', mode, adminId, clientId],
    initialPageParam: null as SalesPageCursor,
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
    if (dayGroups.length === 0 && hasNextPage && !isFetchingNextPage && !isPending && !isError) {
      void fetchNextPage();
    }
  }, [dayGroups.length, hasNextPage, isFetchingNextPage, isPending, isError, fetchNextPage]);

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

  if (isPending || (dayGroups.length === 0 && hasNextPage)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
        {dayGroups.length === 0 && hasNextPage ? (
          <Text style={styles.scanning}>Looking for upcoming bookings…</Text>
        ) : null}
      </View>
    );
  }

  if (isError) {
    return (
      <Text style={styles.empty}>
        {error instanceof Error ? error.message : 'Could not load upcoming trips.'}
      </Text>
    );
  }

  if (dayGroups.length === 0) {
    return <Text style={styles.empty}>No upcoming trips for this client.</Text>;
  }

  return (
    <FlashList
      data={dayGroups}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    paddingTop: 48,
    alignItems: 'center',
    gap: 12,
  },
  scanning: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: 24,
  },
  footerLoader: {
    marginVertical: 20,
  },
});
