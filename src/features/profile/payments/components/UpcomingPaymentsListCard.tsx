/**
 * Payments → UPCOMING PAYMENTS (tab body).
 * White card + client-side page window over CRM UpcomingPaymentItem rows.
 */
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { UpcomingPaymentRow } from '@/features/profile/payments/components/UpcomingPaymentRow';
import type { UpcomingPaymentItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingPaymentsListCardProps = {
  items: UpcomingPaymentItem[];
  hasDue?: boolean;
  hasMore?: boolean;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
};

export function UpcomingPaymentsListCard({
  items,
  hasMore = false,
  isLoading = false,
  isFetchingMore = false,
  onLoadMore,
}: UpcomingPaymentsListCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>UPCOMING PAYMENTS</Text>

      <View style={styles.card}>
        {isLoading && items.length === 0 ? (
          <View style={styles.emptyScanning}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.empty}>Loading upcoming payments…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No upcoming payments.</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <UpcomingPaymentRow
              key={item.entryId || `${item.saleId}-${index}`}
              item={item}
              showDivider={index > 0}
            />
          ))
        )}

        {hasMore && items.length > 0 ? (
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
  sectionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: colors.muted,
    textTransform: 'uppercase',
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
