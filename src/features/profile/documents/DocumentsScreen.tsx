/**
 * Profile → Documents.
 * Trips: paginated client sales with confirmationDoc (infinite query).
 * Personal: paginated travellers → customerProfile passports / visas / memberships.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import {
  DocumentsTabs,
  type DocumentsTabId,
} from '@/features/profile/documents/components/DocumentsTabs';
import { PersonalDocumentsListCard } from '@/features/profile/documents/components/PersonalDocumentsListCard';
import { TripDocumentsListCard } from '@/features/profile/documents/components/TripDocumentsListCard';
import {
  getClientPersonalDocumentsPage,
  getClientTripDocumentsPage,
  mapDocumentsLoadErrorToMessage,
  type PersonalDocumentItem,
  type PersonalDocumentsPageCursor,
  type TripDocumentItem,
  type TripDocumentsPageCursor,
} from '@/lib/firebase/documents';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function DocumentsScreen() {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;
  const [tab, setTab] = useState<DocumentsTabId>('trips');

  const hasScope = Boolean(adminId && clientId);
  const sessionReady = !isHydrating && hasScope;

  const trips = useInfiniteQuery({
    queryKey: ['profile', 'documents', 'trips', adminId, clientId],
    initialPageParam: null as TripDocumentsPageCursor,
    queryFn: async ({ pageParam }) => getClientTripDocumentsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: sessionReady && tab === 'trips',
    retry: 2,
  });

  const personal = useInfiniteQuery({
    queryKey: ['profile', 'documents', 'personal', adminId, clientId],
    initialPageParam: null as PersonalDocumentsPageCursor,
    queryFn: async ({ pageParam }) => getClientPersonalDocumentsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: sessionReady && tab === 'personal',
    retry: 2,
  });

  const {
    hasNextPage: tripsHasNextPage,
    isFetchingNextPage: tripsIsFetchingNextPage,
    isPending: tripsIsPending,
    isError: tripsIsError,
    fetchNextPage: fetchNextTripsPage,
  } = trips;

  const {
    hasNextPage: personalHasNextPage,
    isFetchingNextPage: personalIsFetchingNextPage,
    isPending: personalIsPending,
    isError: personalIsError,
    fetchNextPage: fetchNextPersonalPage,
  } = personal;

  const tripDocuments = useMemo(() => {
    const merged = trips.data?.pages.flatMap((p) => p.documents) ?? [];
    const byPath = new Map<string, TripDocumentItem>();
    for (const doc of merged) {
      byPath.set(doc.documentPath, doc);
    }
    return [...byPath.values()].sort((a, b) =>
      String(b.travelDateKey || '').localeCompare(String(a.travelDateKey || '')),
    );
  }, [trips.data]);

  const personalDocuments = useMemo(() => {
    const merged = personal.data?.pages.flatMap((p) => p.documents) ?? [];
    const byPath = new Map<string, PersonalDocumentItem>();
    for (const doc of merged) {
      byPath.set(doc.documentPath, doc);
    }
    return [...byPath.values()].sort((a, b) =>
      String(b.dateKey || '').localeCompare(String(a.dateKey || '')),
    );
  }, [personal.data]);

  // Many sales lack confirmationDoc — keep scanning until we have rows or exhaust.
  useEffect(() => {
    if (tab !== 'trips') return;
    if (
      tripDocuments.length === 0 &&
      tripsHasNextPage &&
      !tripsIsFetchingNextPage &&
      !tripsIsPending &&
      !tripsIsError
    ) {
      void fetchNextTripsPage();
    }
  }, [
    tab,
    tripDocuments.length,
    tripsHasNextPage,
    tripsIsFetchingNextPage,
    tripsIsPending,
    tripsIsError,
    fetchNextTripsPage,
  ]);

  // Keep scanning travellers until we surface docs or exhaust the list.
  useEffect(() => {
    if (tab !== 'personal') return;
    if (
      personalDocuments.length === 0 &&
      personalHasNextPage &&
      !personalIsFetchingNextPage &&
      !personalIsPending &&
      !personalIsError
    ) {
      void fetchNextPersonalPage();
    }
  }, [
    tab,
    personalDocuments.length,
    personalHasNextPage,
    personalIsFetchingNextPage,
    personalIsPending,
    personalIsError,
    fetchNextPersonalPage,
  ]);

  const tripsLoading =
    tab === 'trips' &&
    (isHydrating ||
      trips.isPending ||
      (tripDocuments.length === 0 && Boolean(trips.hasNextPage) && !trips.isError));

  const personalLoading =
    tab === 'personal' &&
    (isHydrating ||
      personal.isPending ||
      (personalDocuments.length === 0 && Boolean(personal.hasNextPage) && !personal.isError));

  const tripsError =
    tab === 'trips'
      ? !isHydrating && !hasScope
        ? mapDocumentsLoadErrorToMessage(new Error('Missing adminId or clientId'), 'trips')
        : trips.isError
          ? mapDocumentsLoadErrorToMessage(trips.error, 'trips')
          : null
      : null;

  const personalError =
    tab === 'personal'
      ? !isHydrating && !hasScope
        ? mapDocumentsLoadErrorToMessage(new Error('Missing adminId or clientId'), 'personal')
        : personal.isError
          ? mapDocumentsLoadErrorToMessage(personal.error, 'personal')
          : null
      : null;

  return (
    <ProfileSectionShell title="Documents" subtitle="Vouchers, tickets and confirmations.">
      <DocumentsTabs active={tab} onChange={setTab} />

      {tab === 'trips' ? (
        <>
          {tripsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.forest} />
              {tripDocuments.length === 0 && trips.hasNextPage ? (
                <Text style={styles.scanning}>Looking for trip documents…</Text>
              ) : null}
            </View>
          ) : null}

          {!tripsLoading && tripsError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{tripsError}</Text>
              <Pressable onPress={() => void trips.refetch()} style={styles.retry}>
                <Text style={styles.retryLabel}>{trips.isRefetching ? 'Retrying…' : 'Retry'}</Text>
              </Pressable>
            </View>
          ) : null}

          {!tripsLoading && !tripsError ? (
            <>
              <TripDocumentsListCard documents={tripDocuments} />
              {trips.hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Load more trip documents"
                  disabled={trips.isFetchingNextPage}
                  onPress={() => void trips.fetchNextPage()}
                  style={styles.loadMore}
                >
                  {trips.isFetchingNextPage ? (
                    <ActivityIndicator color={colors.forest} />
                  ) : (
                    <Text style={styles.loadMoreLabel}>Load more</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <>
          {personalLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.forest} />
              {personalDocuments.length === 0 && personal.hasNextPage ? (
                <Text style={styles.scanning}>Looking for personal documents…</Text>
              ) : null}
            </View>
          ) : null}

          {!personalLoading && personalError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{personalError}</Text>
              <Pressable onPress={() => void personal.refetch()} style={styles.retry}>
                <Text style={styles.retryLabel}>
                  {personal.isRefetching ? 'Retrying…' : 'Retry'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!personalLoading && !personalError ? (
            <>
              <PersonalDocumentsListCard documents={personalDocuments} />
              {personal.hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Load more personal documents"
                  disabled={personal.isFetchingNextPage}
                  onPress={() => void personal.fetchNextPage()}
                  style={styles.loadMore}
                >
                  {personal.isFetchingNextPage ? (
                    <ActivityIndicator color={colors.forest} />
                  ) : (
                    <Text style={styles.loadMoreLabel}>Load more</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  scanning: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
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
  loadMore: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 14,
  },
  loadMoreLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
});
