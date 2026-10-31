/**
 * One invoice = one card.
 * Visual styles live on <View>, not on Pressable function styles (NativeWind-safe).
 * Text stays inside the card; amount never crushes the title on small phones.
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
  /** Stack amount under title on very narrow screens */
  stack: boolean;
  amountColMax: number;
};

function layoutForWidth(width: number): InvoiceCardLayout {
  if (width < 360) {
    return {
      padH: 16,
      padV: 16,
      radius: 16,
      colGap: 10,
      textGap: 6,
      titleSize: 14,
      titleLineHeight: 19,
      metaSize: 11,
      metaLineHeight: 15,
      amountSize: 16,
      amountLineHeight: 20,
      stack: true,
      amountColMax: 120,
    };
  }
  if (width < 400) {
    return {
      padH: 18,
      padV: 18,
      radius: 18,
      colGap: 12,
      textGap: 7,
      titleSize: 15,
      titleLineHeight: 20,
      metaSize: 12,
      metaLineHeight: 16,
      amountSize: 17,
      amountLineHeight: 21,
      stack: false,
      amountColMax: 112,
    };
  }
  if (width < 768) {
    return {
      padH: 20,
      padV: 20,
      radius: 20,
      colGap: 14,
      textGap: 8,
      titleSize: 15,
      titleLineHeight: 21,
      metaSize: 12,
      metaLineHeight: 17,
      amountSize: 18,
      amountLineHeight: 22,
      stack: false,
      amountColMax: 128,
    };
  }
  return {
    padH: 24,
    padV: 22,
    radius: 22,
    colGap: 16,
    textGap: 9,
    titleSize: 16,
    titleLineHeight: 22,
    metaSize: 13,
    metaLineHeight: 18,
    amountSize: 19,
    amountLineHeight: 24,
    stack: false,
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open invoice ${item.invoiceNo}`}
      onPress={onPress}
      style={styles.pressable}
    >
      <View
        style={[
          styles.card,
          {
            borderRadius: layout.radius,
            paddingHorizontal: layout.padH,
            paddingVertical: layout.padV,
          },
        ]}
      >
        <View
          style={[
            styles.content,
            layout.stack ? styles.contentStack : styles.contentRow,
            { gap: layout.stack ? layout.textGap : layout.colGap },
          ]}
        >
          <View style={[styles.copy, { gap: layout.textGap }]}>
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

          <View
            style={[
              styles.amountWrap,
              layout.stack ? styles.amountWrapStack : { maxWidth: layout.amountColMax },
            ]}
          >
            <Text
              style={[
                styles.amount,
                layout.stack ? styles.amountLeft : styles.amountRight,
                {
                  fontSize: layout.amountSize,
                  lineHeight: layout.amountLineHeight,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {item.amountLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const InvoiceListItemCard = memo(InvoiceListItemCardComponent);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#1B2915',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  content: {
    width: '100%',
    minWidth: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  contentStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  amountWrap: {
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  amountWrapStack: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
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
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
  },
  amountRight: {
    width: '100%',
    textAlign: 'right',
  },
  amountLeft: {
    textAlign: 'left',
  },
});
