/**
 * Profile → Documents.
 * Trips: paginated client sales with confirmationDoc (infinite query).
 * Personal: placeholder (traveller / identity docs later).
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import {
  DocumentsTabs,
  type DocumentsTabId,
} from '@/features/profile/documents/components/DocumentsTabs';
import { TripDocumentsListCard } from '@/features/profile/documents/components/TripDocumentsListCard';
import {
  getClientTripDocumentsPage,
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

  const {
    data,
    error,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['profile', 'documents', 'trips', adminId, clientId],
    initialPageParam: null as TripDocumentsPageCursor,
    queryFn: async ({ pageParam }) => getClientTripDocumentsPage(adminId, clientId, pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: !isHydrating && Boolean(adminId && clientId) && tab === 'trips',
    retry: 2,
  });

  const documents = useMemo(() => {
    const merged = data?.pages.flatMap((p) => p.documents) ?? [];
    const byPath = new Map<string, TripDocumentItem>();
    for (const doc of merged) {
      byPath.set(doc.documentPath, doc);
    }
    return [...byPath.values()].sort((a, b) =>
      String(b.travelDateKey || '').localeCompare(String(a.travelDateKey || '')),
    );
  }, [data]);

  // Many sales lack confirmationDoc — keep scanning until we have rows or exhaust.
  useEffect(() => {
    if (tab !== 'trips') return;
    if (documents.length === 0 && hasNextPage && !isFetchingNextPage && !isPending && !isError) {
      void fetchNextPage();
    }
  }, [tab, documents.length, hasNextPage, isFetchingNextPage, isPending, isError, fetchNextPage]);

  const loading =
    tab === 'trips' &&
    (isHydrating || isPending || (documents.length === 0 && Boolean(hasNextPage) && !isError));

  const loadError =
    tab === 'trips' && isError
      ? error instanceof Error
        ? error.message
        : 'Failed to load trip documents'
      : null;

  return (
    <ProfileSectionShell title="Documents" subtitle="Vouchers, tickets and confirmations.">
      <DocumentsTabs active={tab} onChange={setTab} />

      {tab === 'trips' ? (
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.forest} />
              {documents.length === 0 && hasNextPage ? (
                <Text style={styles.scanning}>Looking for trip documents…</Text>
              ) : null}
            </View>
          ) : null}

          {!loading && loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={() => void refetch()} style={styles.retry}>
                <Text style={styles.retryLabel}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !loadError ? (
            <>
              <TripDocumentsListCard documents={documents} />
              {hasNextPage ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Load more documents"
                  disabled={isFetchingNextPage}
                  onPress={() => void fetchNextPage()}
                  style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
                >
                  {isFetchingNextPage ? (
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
        <View style={styles.personalBox}>
          <Text style={styles.personalText}>Personal travel documents will appear here.</Text>
        </View>
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
  personalBox: {
    borderRadius: 20,
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
  },
  personalText: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
