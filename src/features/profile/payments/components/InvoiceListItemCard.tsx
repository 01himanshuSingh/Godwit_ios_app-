/**
 * One invoice = one card.
 * Responsive type + padding: title/meta stay readable; amount never crushes the left column.
 */
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ClientInvoiceItem } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type InvoiceListItemCardProps = {
  item: ClientInvoiceItem;
  onPress: () => void;
};

type InvoiceCardLayout = {
  padH: number;
  padV: number;
  radius: number;
  colGap: number;
  textGap: number;
  titleSize: number;
  titleLineHeight: number;
  metaSize: number;
  metaLineHeight: number;
  amountSize: number;
  amountLineHeight: number;
  /** Fixed px cap so amount column doesn't steal title space */
  amountColMax: number;
};

function layoutForWidth(width: number): InvoiceCardLayout {
  if (width < 360) {
    return {
      padH: 16,
      padV: 18,
      radius: 16,
      colGap: 10,
      textGap: 6,
      titleSize: 14,
      titleLineHeight: 19,
      metaSize: 11,
      metaLineHeight: 15,
      amountSize: 15,
      amountLineHeight: 19,
      amountColMax: 108,
    };
  }
  if (width < 400) {
    return {
      padH: 18,
      padV: 20,
      radius: 18,
      colGap: 12,
      textGap: 7,
      titleSize: 15,
      titleLineHeight: 20,
      metaSize: 12,
      metaLineHeight: 16,
      amountSize: 16,
      amountLineHeight: 21,
      amountColMax: 118,
    };
  }
  if (width < 768) {
    return {
      padH: 20,
      padV: 22,
      radius: 20,
      colGap: 14,
      textGap: 8,
      titleSize: 15,
      titleLineHeight: 21,
      metaSize: 12,
      metaLineHeight: 17,
      amountSize: 17,
      amountLineHeight: 22,
      amountColMax: 128,
    };
  }
  return {
    padH: 24,
    padV: 24,
    radius: 22,
    colGap: 16,
    textGap: 9,
    titleSize: 16,
    titleLineHeight: 22,
    metaSize: 13,
    metaLineHeight: 18,
    amountSize: 18,
    amountLineHeight: 24,
    amountColMax: 148,
  };
}

function InvoiceListItemCardComponent({ item, onPress }: InvoiceListItemCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  const metaLine = useMemo(() => {
    const bits = [item.invoiceNo?.trim(), item.issuedAtLabel?.trim()].filter(Boolean);
    return bits.length ? bits.join(' · ') : null;
  }, [item.invoiceNo, item.issuedAtLabel]);

  return (
    <View style={[styles.cardShell, { borderRadius: layout.radius }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open invoice ${item.invoiceNo}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardBody,
          {
            borderRadius: layout.radius,
            paddingHorizontal: layout.padH,
            paddingVertical: layout.padV,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.left,
              {
                gap: layout.textGap,
                marginRight: layout.colGap,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: layout.titleSize,
                  lineHeight: layout.titleLineHeight,
                },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            {metaLine ? (
              <Text
                style={[
                  styles.meta,
                  {
                    fontSize: layout.metaSize,
                    lineHeight: layout.metaLineHeight,
                  },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {metaLine}
              </Text>
            ) : null}
          </View>

          <View style={[styles.right, { maxWidth: layout.amountColMax }]}>
            <Text
              style={[
                styles.amount,
                {
                  fontSize: layout.amountSize,
                  lineHeight: layout.amountLineHeight,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.amountLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export const InvoiceListItemCard = memo(InvoiceListItemCardComponent);

const styles = StyleSheet.create({
  cardShell: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardBody: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  left: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  right: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  title: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
    flexShrink: 1,
  },
  meta: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    flexShrink: 1,
  },
  amount: {
    width: '100%',
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.88,
  },
});
