/**
 * Profile → Documents.
 * Trips: paginated sales with confirmationDoc.
 * Personal: travellers → customerProfile passports / visas / memberships.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { DocumentsExceptionCard } from '@/features/profile/documents/components/DocumentsExceptionCard';
import { DocumentsSkeleton } from '@/features/profile/documents/components/DocumentsSkeleton';
import {
  DocumentsTabs,
  type DocumentsTabId,
} from '@/features/profile/documents/components/DocumentsTabs';
import { PersonalDocumentsListCard } from '@/features/profile/documents/components/PersonalDocumentsListCard';
import { TripDocumentsListCard } from '@/features/profile/documents/components/TripDocumentsListCard';
import {
  classifyDocumentsLoadError,
  getClientPersonalDocumentsPage,
  getClientTripDocumentsPage,
  mapDocumentsLoadErrorToMessage,
  type DocumentsLoadErrorKind,
  type PersonalDocumentItem,
  type PersonalDocumentsPageCursor,
  type TripDocumentItem,
  type TripDocumentsPageCursor,
} from '@/lib/firebase/documents';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TabException = {
  kind: DocumentsLoadErrorKind;
  message: string;
  canRetry: boolean;
};

export function DocumentsScreen() {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() ?? '';
  const clientId = profile?.clientId?.trim() ?? '';
  const [tab, setTab] = useState<DocumentsTabId>('trips');
  const [visited, setVisited] = useState<Record<DocumentsTabId, boolean>>({
    trips: true,
    personal: false,
  });

  const hasScope = Boolean(adminId && clientId);
  const sessionReady = !isHydrating && hasScope;

  const selectTab = (next: DocumentsTabId) => {
    setTab(next);
    setVisited((prev) => (prev[next] ? prev : { ...prev, [next]: true }));
  };

  const trips = useInfiniteQuery({
    queryKey: ['profile', 'documents', 'trips', adminId, clientId],
    initialPageParam: null as TripDocumentsPageCursor,
    queryFn: async ({ pageParam }) => getClientTripDocumentsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: sessionReady && (tab === 'trips' || visited.trips),
    retry: 2,
  });

  const personal = useInfiniteQuery({
    queryKey: ['profile', 'documents', 'personal', adminId, clientId],
    initialPageParam: null as PersonalDocumentsPageCursor,
    queryFn: async ({ pageParam }) => getClientPersonalDocumentsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: sessionReady && (tab === 'personal' || visited.personal),
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
    const pages = trips.data?.pages;
    if (!pages) return [] as TripDocumentItem[];
    const byPath = new Map<string, TripDocumentItem>();
    for (const page of pages) {
      for (const doc of page.documents ?? []) {
        byPath.set(doc.documentPath, doc);
      }
    }
    return [...byPath.values()].sort((a, b) =>
      String(b.travelDateKey || '').localeCompare(String(a.travelDateKey || '')),
    );
  }, [trips.data]);

  const personalDocuments = useMemo(() => {
    const pages = personal.data?.pages;
    if (!pages) return [] as PersonalDocumentItem[];
    const byPath = new Map<string, PersonalDocumentItem>();
    for (const page of pages) {
      for (const doc of page.documents ?? []) {
        byPath.set(doc.documentPath, doc);
      }
    }
    return [...byPath.values()].sort((a, b) =>
      String(b.dateKey || '').localeCompare(String(a.dateKey || '')),
    );
  }, [personal.data]);

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

  const tripsScanning = tripDocuments.length === 0 && Boolean(trips.hasNextPage) && !trips.isError;
  const personalScanning =
    personalDocuments.length === 0 && Boolean(personal.hasNextPage) && !personal.isError;

  const tripsLoading =
    tab === 'trips' &&
    (isHydrating || trips.isPending || (tripsScanning && tripDocuments.length === 0));

  const personalLoading =
    tab === 'personal' &&
    (isHydrating || personal.isPending || (personalScanning && personalDocuments.length === 0));

  const tripsException = useMemo((): TabException | null => {
    if (tab !== 'trips' || isHydrating) return null;
    if (!hasScope) {
      return {
        kind: 'missing_scope',
        message: 'Account details are missing. Please sign in again.',
        canRetry: false,
      };
    }
    if (trips.isError) {
      const kind = classifyDocumentsLoadError(trips.error);
      return {
        kind,
        message: mapDocumentsLoadErrorToMessage(trips.error, 'trips'),
        canRetry: kind !== 'missing_scope',
      };
    }
    return null;
  }, [hasScope, isHydrating, tab, trips.error, trips.isError]);

  const personalException = useMemo((): TabException | null => {
    if (tab !== 'personal' || isHydrating) return null;
    if (!hasScope) {
      return {
        kind: 'missing_scope',
        message: 'Account details are missing. Please sign in again.',
        canRetry: false,
      };
    }
    if (personal.isError) {
      const kind = classifyDocumentsLoadError(personal.error);
      return {
        kind,
        message: mapDocumentsLoadErrorToMessage(personal.error, 'personal'),
        canRetry: kind !== 'missing_scope',
      };
    }
    return null;
  }, [hasScope, isHydrating, personal.error, personal.isError, tab]);

  return (
    <ProfileSectionShell
      title="Documents"
      subtitle="Vouchers, tickets and confirmations."
      layoutPreset="travellers"
    >
      <View style={styles.body}>
        <DocumentsTabs active={tab} onChange={selectTab} />

        {tab === 'trips' ? (
          tripsException ? (
            <DocumentsExceptionCard
              kind={tripsException.kind}
              message={tripsException.message}
              scope="trips"
              isRetrying={trips.isFetching}
              onRetry={tripsException.canRetry ? () => void trips.refetch() : undefined}
            />
          ) : tripsLoading && tripDocuments.length === 0 ? (
            <DocumentsSkeleton />
          ) : (
            <>
              <TripDocumentsListCard
                documents={tripDocuments}
                isScanning={tripsScanning && tripDocuments.length === 0}
              />
              {trips.hasNextPage && tripDocuments.length > 0 ? (
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
          )
        ) : null}

        {tab === 'personal' ? (
          personalException ? (
            <DocumentsExceptionCard
              kind={personalException.kind}
              message={personalException.message}
              scope="personal"
              isRetrying={personal.isFetching}
              onRetry={personalException.canRetry ? () => void personal.refetch() : undefined}
            />
          ) : personalLoading && personalDocuments.length === 0 ? (
            <DocumentsSkeleton />
          ) : (
            <>
              <PersonalDocumentsListCard
                documents={personalDocuments}
                isScanning={personalScanning && personalDocuments.length === 0}
              />
              {personal.hasNextPage && personalDocuments.length > 0 ? (
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
          )
        ) : null}
      </View>
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  body: {
    width: '100%',
    gap: 16,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.forest,
  },
});
