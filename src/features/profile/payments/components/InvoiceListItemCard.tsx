/**
 * One invoice row inside the shared Invoices card.
 * CRM: title, invoiceNo, issuedAtLabel, amountLabel.
 */
import Feather from '@expo/vector-icons/Feather';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClientInvoiceItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type InvoiceListItemCardProps = {
  item: ClientInvoiceItem;
  onPress: () => void;
  showDivider?: boolean;
};

function InvoiceListItemCardComponent({
  item,
  onPress,
  showDivider = false,
}: InvoiceListItemCardProps) {
  const metaLine = useMemo(() => {
    const bits = [item.invoiceNo?.trim(), item.issuedAtLabel?.trim()].filter(Boolean);
    return bits.length ? bits.join(' · ') : null;
  }, [item.invoiceNo, item.issuedAtLabel]);

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open invoice ${item.invoiceNo}`}
        onPress={onPress}
        style={styles.pressable}
      >
        <View style={styles.row}>
          <View style={styles.iconWell}>
            <Feather name="file-text" size={16} color={colors.forest} />
          </View>

          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            {metaLine ? (
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                {metaLine}
              </Text>
            ) : null}
          </View>

          <View style={styles.trailing}>
            <Text
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.amountLabel}
            </Text>
            <Feather name="chevron-right" size={16} color="#C4C0B8" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export const InvoiceListItemCard = memo(InvoiceListItemCardComponent);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },
  meta: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    maxWidth: '42%',
  },
  amount: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    textAlign: 'right',
  },
  divider: {
    marginLeft: 66,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
