/**
 * DOCUMENTS card on Active Trip detail — all services.
 * Shows CRM voucher PDF (`confirmationDoc` → detail.voucherUrl) or empty state.
 */
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { downloadSaleVoucherPdf, openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TripDocumentsCardProps = {
  /** HTTPS PDF URL from sale.confirmationDoc — null when not uploaded. */
  voucherUrl: string | null | undefined;
  /** Display name (trip title / hotel name). */
  fileLabel: string | null | undefined;
};

export function TripDocumentsCard({ voucherUrl, fileLabel }: TripDocumentsCardProps) {
  const url = voucherUrl?.trim() || null;
  const label = (fileLabel?.trim() || 'Trip voucher').trim();
  const [downloading, setDownloading] = useState(false);

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
          <Feather name="file-text" size={18} color={colors.muted} style={styles.icon} />
          <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View voucher PDF"
            onPress={onView}
            hitSlop={8}
            style={({ pressed }) => [styles.actionHit, pressed && styles.pressed]}
          >
            <Text style={styles.action}>View</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download voucher PDF"
            onPress={() => {
              void onDownload();
            }}
            hitSlop={8}
            disabled={downloading}
            style={({ pressed }) => [styles.actionHit, pressed && styles.pressed]}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <Text style={styles.action}>Download</Text>
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
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#F8F7F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  heading: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
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
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 20,
    color: colors.forest,
  },
  actionHit: {
    flexShrink: 0,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  action: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.muted,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
