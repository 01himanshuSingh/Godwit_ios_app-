/**
 * Payments → CREDITS AND REFUNDS (tab body).
 * White card of return-icon rows + DIRECT REMITTANCES chrome + in-card Load more.
 * CRM CreditRefundItem fields only.
 */
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CreditRefundRow } from '@/features/profile/payments/components/CreditRefundRow';
import type { CreditRefundItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CreditsAndRefundsListCardProps = {
  items: CreditRefundItem[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  isScanning?: boolean;
};

export function CreditsAndRefundsListCard({
  items,
  hasMore = false,
  isFetchingMore = false,
  isLoading = false,
  onLoadMore,
  isScanning = false,
}: CreditsAndRefundsListCardProps) {
  const showBusyEmpty = (isLoading || isScanning) && items.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>CREDITS AND REFUNDS</Text>
        {items.length > 0 ? <Text style={styles.remittanceLabel}>DIRECT REMITTANCES</Text> : null}
      </View>

      <View style={styles.card}>
        {showBusyEmpty ? (
          <View style={styles.emptyScanning}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.empty}>
              {isScanning ? 'Looking for credits and refunds…' : 'Loading credits…'}
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No credits or refunds yet.</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <CreditRefundRow
              key={item.entryId || `credit-refund-${index}`}
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
  remittanceLabel: {
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
