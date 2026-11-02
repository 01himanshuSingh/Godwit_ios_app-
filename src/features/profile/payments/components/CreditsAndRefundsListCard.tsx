/**
 * Payments → CREDITS AND REFUNDS.
 * One white card with inset dividers (mock). Empty → same card shell + copy.
 * Cursor pagination via Load more.
 */
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CreditRefundRow } from '@/features/profile/payments/components/CreditRefundRow';
import type { CreditRefundItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CreditsAndRefundsListCardProps = {
  items: CreditRefundItem[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  isScanning?: boolean;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      sectionSize: 10,
      labelToList: 10,
      radius: 16,
      emptyPadH: 16,
      emptyPadV: 14,
    };
  }
  if (width < 400) {
    return {
      sectionSize: 11,
      labelToList: 12,
      radius: 18,
      emptyPadH: 18,
      emptyPadV: 16,
    };
  }
  return {
    sectionSize: 11,
    labelToList: 14,
    radius: 20,
    emptyPadH: 22,
    emptyPadV: 20,
  };
}

export function CreditsAndRefundsListCard({
  items,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  isScanning = false,
}: CreditsAndRefundsListCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionLabel,
          {
            fontSize: layout.sectionSize,
            letterSpacing: 1.2,
            marginBottom: layout.labelToList,
          },
        ]}
      >
        CREDITS AND REFUNDS
      </Text>

      <View style={[styles.card, { borderRadius: layout.radius }]}>
        {items.length === 0 ? (
          <View
            style={{
              paddingHorizontal: layout.emptyPadH,
              paddingVertical: layout.emptyPadV,
              alignItems: isScanning ? 'center' : undefined,
              gap: isScanning ? 10 : 0,
            }}
          >
            {isScanning ? (
              <>
                <ActivityIndicator color={colors.forest} />
                <Text style={styles.empty}>Looking for credits and refunds…</Text>
              </>
            ) : (
              <Text style={styles.empty}>No credits or refunds yet.</Text>
            )}
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
      </View>

      {hasMore && items.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load more credits and refunds"
          disabled={isFetchingMore}
          onPress={onLoadMore}
          style={styles.loadMore}
        >
          {isFetchingMore ? (
            <ActivityIndicator color={colors.forest} />
          ) : (
            <Text style={styles.loadMoreLabel}>Load more</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#1B2915',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
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
