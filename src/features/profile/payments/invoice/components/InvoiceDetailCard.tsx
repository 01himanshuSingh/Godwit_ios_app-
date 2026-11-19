/**
 * Payments → Invoice detail card + PDF actions.
 * Type scale from invoice-detail spec; CRM fields only (no invented copy).
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ClientInvoiceDetail } from '@/lib/firebase/payments';
import { downloadSaleVoucherPdf, openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type InvoiceDetailCardProps = {
  invoice: ClientInvoiceDetail;
};

type FieldValueWeight = 'regular' | 'medium' | 'semibold';

function layoutForWidth(width: number) {
  const narrow = width < 360;
  return {
    padH: narrow ? 18 : 22,
    padV: narrow ? 20 : 24,
    radius: narrow ? 18 : 20,
    amountSize: narrow ? 10 : 11,
  };
}

function valueFont(weight: FieldValueWeight) {
  if (weight === 'semibold') return fontFamily.manrope.semibold;
  if (weight === 'medium') return fontFamily.manrope.medium;
  return fontFamily.manrope.regular;
}

function Field({
  label,
  value,
  valueSize,
  valueWeight,
}: {
  label: string;
  value: string;
  valueSize: number;
  valueWeight: FieldValueWeight;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text
        style={[
          styles.fieldValue,
          {
            fontFamily: valueFont(valueWeight),
            fontSize: valueSize,
            lineHeight: valueSize + 4,
          },
        ]}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

/** CRM has no dedicated invoice PDF — use confirmation/voucher doc when present. */
function documentUrl(invoice: ClientInvoiceDetail): string | null {
  const voucher = invoice.voucherUrl?.trim();
  return voucher || null;
}

export function InvoiceDetailCard({ invoice }: InvoiceDetailCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [busy, setBusy] = useState<'view' | 'share' | 'download' | null>(null);
  const docUrl = documentUrl(invoice);
  const fileLabel = invoice.invoiceNumber || 'invoice';

  const ensureDoc = (): string | null => {
    if (docUrl) return docUrl;
    Alert.alert(
      'Invoice PDF',
      'This invoice PDF isn’t available yet. Please contact your travel director.',
    );
    return null;
  };

  const onView = async () => {
    const url = ensureDoc();
    if (!url) return;
    setBusy('view');
    try {
      await openSaleVoucherPdf(url, fileLabel);
    } finally {
      setBusy(null);
    }
  };

  const onShareOrDownload = async (mode: 'share' | 'download') => {
    const url = ensureDoc();
    if (!url) return;
    setBusy(mode);
    try {
      await downloadSaleVoucherPdf(url, fileLabel);
    } finally {
      setBusy(null);
    }
  };

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
          <Text style={styles.brand}>G O D W I T</Text>
          <Text style={styles.tagline}>Private travel management</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.fields}>
          <Field
            label="INVOICE NUMBER"
            value={invoice.invoiceNumber}
            valueSize={12}
            valueWeight="semibold"
          />
          {invoice.clientName.trim() ? (
            <Field label="CLIENT" value={invoice.clientName} valueSize={11} valueWeight="medium" />
          ) : null}
          {invoice.issueDateLabel ? (
            <Field
              label="ISSUE DATE"
              value={invoice.issueDateLabel}
              valueSize={11}
              valueWeight="regular"
            />
          ) : null}
          {invoice.tripReference ? (
            <Field
              label="TRIP REFERENCE"
              value={invoice.tripReference}
              valueSize={11}
              valueWeight="regular"
            />
          ) : null}
          {invoice.currency.trim() ? (
            <Field label="CURRENCY" value={invoice.currency} valueSize={11} valueWeight="regular" />
          ) : null}
        </View>

        {invoice.lineItems.length > 0 ? (
          <>
            <View style={styles.rule} />

            <View style={styles.lineHeader}>
              <Text style={styles.colHeader}>ITEM / SERVICE</Text>
              <Text style={styles.colHeader}>AMOUNT</Text>
            </View>

            <View style={styles.lines}>
              {invoice.lineItems.map((line, index) => (
                <View key={`${line.description}-${index}`} style={styles.lineRow}>
                  <Text style={styles.lineDesc} numberOfLines={3} ellipsizeMode="tail">
                    {line.description}
                  </Text>
                  <Text
                    style={[
                      styles.lineAmount,
                      { fontSize: layout.amountSize, lineHeight: layout.amountSize + 4 },
                    ]}
                    numberOfLines={1}
                  >
                    {line.amountLabel}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View invoice PDF"
          disabled={busy !== null}
          onPress={() => {
            void onView();
          }}
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || busy === 'view') && styles.pressed,
          ]}
        >
          <Feather name="file-text" size={16} color={colors.primaryForeground} />
          <Text style={styles.primaryLabel}>
            {busy === 'view' ? 'Opening…' : 'View invoice PDF'}
          </Text>
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share invoice"
            disabled={busy !== null}
            onPress={() => {
              void onShareOrDownload('share');
            }}
            style={({ pressed }) => [
              styles.secondaryBtn,
              (pressed || busy === 'share') && styles.pressed,
            ]}
          >
            <Feather name="share" size={14} color={colors.forest} />
            <Text style={styles.secondaryLabel}>{busy === 'share' ? 'Sharing…' : 'Share'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download invoice"
            disabled={busy !== null}
            onPress={() => {
              void onShareOrDownload('download');
            }}
            style={({ pressed }) => [
              styles.secondaryBtn,
              (pressed || busy === 'download') && styles.pressed,
            ]}
          >
            <Feather name="download" size={14} color={colors.forest} />
            <Text style={styles.secondaryLabel}>
              {busy === 'download' ? 'Saving…' : 'Download'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 18,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  brandBlock: {
    gap: 4,
    marginBottom: 2,
  },
  brand: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 11,
    letterSpacing: 3.2,
    color: colors.forest,
  },
  tagline: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 8,
    lineHeight: 11,
    color: colors.muted,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  fields: {
    width: '100%',
    gap: 16,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: colors.forest,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  colHeader: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  lines: {
    width: '100%',
    gap: 12,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  lineDesc: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.forest,
  },
  lineAmount: {
    flexShrink: 0,
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
    textAlign: 'right',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryForeground,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.forest,
  },
  pressed: {
    opacity: 0.75,
  },
});
