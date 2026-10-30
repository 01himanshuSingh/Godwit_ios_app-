/**
 * Payments → INVOICES.
 * One InvoiceListItemCard per sale, with responsive section spacing.
 */
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { InvoiceListItemCard } from '@/features/profile/payments/components/InvoiceListItemCard';
import type { ClientInvoiceItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type InvoicesListCardProps = {
  invoices: ClientInvoiceItem[];
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      sectionSize: 10,
      labelToList: 10,
      cardSpacing: 10,
      emptyRadius: 16,
      emptyPadH: 16,
      emptyPadV: 14,
    };
  }
  if (width < 400) {
    return {
      sectionSize: 11,
      labelToList: 12,
      cardSpacing: 12,
      emptyRadius: 18,
      emptyPadH: 18,
      emptyPadV: 16,
    };
  }
  if (width < 768) {
    return {
      sectionSize: 11,
      labelToList: 14,
      cardSpacing: 14,
      emptyRadius: 20,
      emptyPadH: 22,
      emptyPadV: 20,
    };
  }
  return {
    sectionSize: 12,
    labelToList: 16,
    cardSpacing: 16,
    emptyRadius: 22,
    emptyPadH: 26,
    emptyPadV: 22,
  };
}

export function InvoicesListCard({ invoices }: InvoicesListCardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  const openInvoice = useCallback(
    (saleId: string) => {
      router.push(`/profile/payments/${encodeURIComponent(saleId)}`);
    },
    [router],
  );

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionLabel,
          {
            fontSize: layout.sectionSize,
            letterSpacing: 0.9,
            marginBottom: layout.labelToList,
          },
        ]}
      >
        INVOICES
      </Text>

      {invoices.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              borderRadius: layout.emptyRadius,
              paddingHorizontal: layout.emptyPadH,
              paddingVertical: layout.emptyPadV,
            },
          ]}
        >
          <Text style={styles.empty}>No invoices yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {invoices.map((item, index) => (
            <View
              key={item.saleId}
              style={index < invoices.length - 1 ? { marginBottom: layout.cardSpacing } : undefined}
            >
              <InvoiceListItemCard item={item} onPress={() => openInvoice(item.saleId)} />
            </View>
          ))}
        </View>
      )}
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
  list: {
    width: '100%',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
  },
});
