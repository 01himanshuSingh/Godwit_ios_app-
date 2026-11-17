/**
 * DOCUMENTS card on Active Trip detail.
 * Shows CRM voucher PDF (`confirmationDoc` → detail.voucherUrl) when present.
 */
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { downloadSaleVoucherPdf, openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TripDocumentsCardProps = {
  /** HTTPS PDF URL from sale.confirmationDoc — null when not uploaded. */
  voucherUrl: string | null | undefined;
  /** Display name (trip title / hotel name). */
  fileLabel: string | null | undefined;
  /** When true, hide the card entirely if no voucher (hotel mock). */
  hideWhenEmpty?: boolean;
};

export function TripDocumentsCard({
  voucherUrl,
  fileLabel,
  hideWhenEmpty = false,
}: TripDocumentsCardProps) {
  const url = voucherUrl?.trim() || null;
  const label = (fileLabel?.trim() || 'Trip voucher').trim();
  const [downloading, setDownloading] = useState(false);

  if (!url && hideWhenEmpty) {
    return null;
  }

  const onView = () => {
    if (!url) return;
    void openSaleVoucherPdf(url);
  };

  const onDownload = async () => {
    if (!url || downloading) return;
    setDownloading(true);
    try {
      await downloadSaleVoucherPdf(url, label);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.heading}>DOCUMENTS</Text>

      {url ? (
        <View style={styles.row}>
          <Feather name="file-text" size={20} color={colors.muted} style={styles.icon} />
          <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View voucher PDF"
            onPress={onView}
            hitSlop={6}
            style={({ pressed }) => [styles.viewPressable, pressed && styles.pressed]}
          >
            <View style={styles.viewPill}>
              <Text style={styles.viewLabel}>View</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download voucher PDF"
            onPress={() => {
              void onDownload();
            }}
            hitSlop={8}
            disabled={downloading}
            style={({ pressed }) => [styles.downloadHit, pressed && styles.pressed]}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <Feather name="download" size={18} color={colors.muted} />
            )}
          </Pressable>
        </View>
      ) : (
        <Text style={styles.empty}>No documents released for this service yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  heading: {
    ...activeTripType.sectionHeading,
    color: colors.muted,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  icon: {
    flexShrink: 0,
  },
  fileName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.forest,
  },
  viewPressable: {
    flexShrink: 0,
  },
  viewPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    color: colors.forest,
  },
  downloadHit: {
    flexShrink: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
