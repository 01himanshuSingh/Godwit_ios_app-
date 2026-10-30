/**
 * Payments → Invoice detail card (service-mapped sale).
 * Hides: Partially paid badge, Due date, Paid, Outstanding.
 * PDF actions only when pdfUrl exists (CRM has none today).
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ClientInvoiceDetail } from '@/lib/firebase/payments';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type InvoiceDetailCardProps = {
  invoice: ClientInvoiceDetail;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 18,
      radius: 16,
      brandSize: 13,
      taglineSize: 11,
      fieldLabelSize: 10,
      fieldValueSize: 14,
      fieldValueLineHeight: 20,
      lineSize: 14,
      lineLineHeight: 20,
      amountSize: 15,
      amountLineHeight: 20,
      actionSize: 13,
      footerSize: 12,
      footerLineHeight: 17,
      gapField: 14,
    };
  }
  return {
    padH: 22,
    padV: 22,
    radius: 18,
    brandSize: 14,
    taglineSize: 12,
    fieldLabelSize: 10,
    fieldValueSize: 15,
    fieldValueLineHeight: 21,
    lineSize: 15,
    lineLineHeight: 21,
    amountSize: 16,
    amountLineHeight: 22,
    actionSize: 14,
    footerSize: 13,
    footerLineHeight: 18,
    gapField: 16,
  };
}

function Field({
  label,
  value,
  layout,
}: {
  label: string;
  value: string;
  layout: ReturnType<typeof layoutForWidth>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { fontSize: layout.fieldLabelSize, letterSpacing: 1 }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.fieldValue,
          {
            fontSize: layout.fieldValueSize,
            lineHeight: layout.fieldValueLineHeight,
          },
        ]}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

export function InvoiceDetailCard({ invoice }: InvoiceDetailCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const showPdfActions = Boolean(invoice.pdfUrl);

  return (
    <View style={styles.wrap}>
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
        <View style={styles.brandBlock}>
          <Text style={[styles.brand, { fontSize: layout.brandSize, letterSpacing: 4 }]}>
            G O D W I T
          </Text>
          <Text style={[styles.tagline, { fontSize: layout.taglineSize }]}>
            Private travel management
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={[styles.fields, { gap: layout.gapField }]}>
          <Field label="INVOICE NUMBER" value={invoice.invoiceNumber} layout={layout} />
          {invoice.clientName ? (
            <Field label="CLIENT" value={invoice.clientName} layout={layout} />
          ) : null}
          {invoice.issueDateLabel ? (
            <Field label="ISSUE DATE" value={invoice.issueDateLabel} layout={layout} />
          ) : null}
          {invoice.tripReference ? (
            <Field label="TRIP REFERENCE" value={invoice.tripReference} layout={layout} />
          ) : null}
          <Field label="CURRENCY" value={invoice.currency} layout={layout} />
        </View>

        <View style={styles.rule} />

        {invoice.lineItems.map((line, index) => (
          <View key={`${line.description}-${index}`} style={styles.lineRow}>
            <Text
              style={[
                styles.lineDesc,
                {
                  fontSize: layout.lineSize,
                  lineHeight: layout.lineLineHeight,
                },
              ]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {line.description}
            </Text>
            <Text
              style={[
                styles.lineAmount,
                {
                  fontSize: layout.amountSize,
                  lineHeight: layout.amountLineHeight,
                },
              ]}
              numberOfLines={1}
            >
              {line.amountLabel}
            </Text>
          </View>
        ))}

        <View style={styles.rule} />

        {showPdfActions && invoice.pdfUrl ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View invoice PDF"
              onPress={() => {
                void Linking.openURL(invoice.pdfUrl as string);
              }}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            >
              <Feather name="file-text" size={16} color={colors.muted} />
              <Text style={[styles.actionLabel, { fontSize: layout.actionSize }]}>
                View invoice PDF
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share invoice"
              onPress={() => {
                void Linking.openURL(invoice.pdfUrl as string);
              }}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            >
              <Feather name="share" size={16} color={colors.muted} />
              <Text style={[styles.actionLabel, { fontSize: layout.actionSize }]}>Share</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download invoice"
              onPress={() => {
                void Linking.openURL(invoice.pdfUrl as string);
              }}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            >
              <Feather name="download" size={16} color={colors.muted} />
              <Text style={[styles.actionLabel, { fontSize: layout.actionSize }]}>Download</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.footerNote,
          {
            fontSize: layout.footerSize,
            lineHeight: layout.footerLineHeight,
          },
        ]}
      >
        To settle this invoice, please contact your travel director for payment instructions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  brandBlock: {
    gap: 4,
    marginBottom: 4,
  },
  // Mock: brand = serif; tagline / labels / values = sans; money = serif
  brand: {
    fontFamily: fontFamily.cormorant.medium,
    color: colors.forest,
  },
  tagline: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  fields: {
    width: '100%',
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineDesc: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.regular,
    color: colors.forest,
  },
  lineAmount: {
    flexShrink: 0,
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#F8F7F4',
  },
  actionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  footerNote: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
