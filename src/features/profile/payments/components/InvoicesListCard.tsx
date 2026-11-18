/**
 * Payments → INVOICES (tab body).
 * Single white card of icon rows + pending count + in-card Load more.
 * CRM ClientInvoiceItem fields only.
 */
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { InvoiceListItemCard } from '@/features/profile/payments/components/InvoiceListItemCard';
import type { ClientInvoiceItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type InvoicesListCardProps = {
  invoices: ClientInvoiceItem[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  isLoading?: boolean;
  isScanning?: boolean;
  onLoadMore?: () => void;
};

export function InvoicesListCard({
  invoices,
  hasMore = false,
  isFetchingMore = false,
  isLoading = false,
  isScanning = false,
  onLoadMore,
}: InvoicesListCardProps) {
  const router = useRouter();

  const openInvoice = useCallback(
    (saleId: string) => {
      router.push(`/profile/payments/${encodeURIComponent(saleId)}`);
    },
    [router],
  );

  const pendingLabel = invoices.length > 0 ? `${invoices.length} PENDING SETTLEMENT` : null;
  const showBusyEmpty = (isLoading || isScanning) && invoices.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>INVOICES</Text>
        {pendingLabel ? <Text style={styles.pendingLabel}>{pendingLabel}</Text> : null}
      </View>

      <View style={styles.card}>
        {showBusyEmpty ? (
          <View style={styles.emptyScanning}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.empty}>
              {isScanning ? 'Looking for invoices…' : 'Loading invoices…'}
            </Text>
          </View>
        ) : invoices.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No invoices yet.</Text>
          </View>
        ) : (
          invoices.map((item, index) => (
            <InvoiceListItemCard
              key={item.saleId}
              item={item}
              showDivider={index > 0}
              onPress={() => openInvoice(item.saleId)}
            />
          ))
        )}

        {hasMore && invoices.length > 0 ? (
          <>
            <View style={styles.loadMoreDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFetchingMore ? 'Loading more' : 'Load more'}
              disabled={isFetchingMore || !onLoadMore}
              onPress={onLoadMore}
              style={styles.loadMoreHit}
            >
              <View style={styles.loadMoreRow}>
                {isFetchingMore ? (
                  <ActivityIndicator size="small" color={colors.forest} />
                ) : (
                  <>
                    <Text style={styles.loadMoreLabel}>Load more</Text>
                    <Feather name="chevron-down" size={14} color={colors.forest} />
                  </>
                )}
              </View>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: colors.muted,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  pendingLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    letterSpacing: 0.7,
    color: colors.muted,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emptyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyScanning: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    color: colors.muted,
  },
  loadMoreDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  loadMoreHit: {
    width: '100%',
  },
  loadMoreRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  loadMoreLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.forest,
  },
});
