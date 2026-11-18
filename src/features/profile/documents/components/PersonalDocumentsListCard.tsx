/**
 * Personal tab — passports / visas / memberships with View + Download.
 * CRM PersonalDocumentItem fields only.
 */
import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { memo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { PersonalDocType, PersonalDocumentItem } from '@/lib/firebase/documents';
import { downloadSaleVoucherPdf, openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type PersonalDocumentsListCardProps = {
  documents: PersonalDocumentItem[];
  isScanning?: boolean;
};

type FeatherName = ComponentProps<typeof Feather>['name'];

function iconForType(type: PersonalDocType): FeatherName {
  switch (type) {
    case 'passport':
      return 'book';
    case 'visa':
      return 'credit-card';
    case 'membership':
      return 'award';
    default:
      return 'file-text';
  }
}

function badgeForType(type: PersonalDocType): string {
  switch (type) {
    case 'passport':
      return 'PASSPORT';
    case 'visa':
      return 'VISA';
    case 'membership':
      return 'MEMBER';
    default:
      return 'DOC';
  }
}

function DocumentRow({ item, showDivider }: { item: PersonalDocumentItem; showDivider: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const meta = item.metaLine || item.dateLabel;

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={styles.rowPad}>
        <View style={styles.topRow}>
          <View style={styles.iconWell}>
            <Feather name={iconForType(item.type)} size={18} color={colors.forest} />
          </View>

          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
            {meta ? (
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                {meta}
              </Text>
            ) : item.travellerName.trim() ? (
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                {item.travellerName.trim()}
              </Text>
            ) : null}
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{badgeForType(item.type)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${item.title}`}
            onPress={() => void openSaleVoucherPdf(item.url)}
            style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
          >
            <Feather name="eye" size={14} color={colors.primaryForeground} />
            <Text style={styles.viewLabel}>View</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              downloading ? `Downloading ${item.title}` : `Download ${item.title}`
            }
            disabled={downloading}
            onPress={() => {
              void (async () => {
                setDownloading(true);
                try {
                  await downloadSaleVoucherPdf(item.url, item.title);
                } finally {
                  setDownloading(false);
                }
              })();
            }}
            style={({ pressed }) => [
              styles.downloadBtn,
              downloading && styles.downloadBusy,
              pressed && styles.pressed,
            ]}
          >
            {downloading ? (
              <>
                <ActivityIndicator size="small" color={colors.forest} />
                <Text style={styles.downloadLabel}>Downloading…</Text>
              </>
            ) : (
              <>
                <Feather name="download" size={14} color={colors.forest} />
                <Text style={styles.downloadLabel}>Download</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const DocumentRowMemo = memo(DocumentRow);

export function PersonalDocumentsListCard({
  documents,
  isScanning = false,
}: PersonalDocumentsListCardProps) {
  const { width } = useWindowDimensions();
  const radius = width < 360 ? 18 : 20;
  const count = documents.length;

  if (documents.length === 0) {
    return (
      <View style={[styles.emptyCard, { borderRadius: radius }]}>
        {isScanning ? (
          <View style={styles.scanning}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.empty}>Looking for personal documents…</Text>
          </View>
        ) : (
          <Text style={styles.empty}>No personal documents uploaded yet.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupLabel}>PERSONAL</Text>
        <Text style={styles.fileCount}>{count === 1 ? '1 File' : `${count} Files`}</Text>
      </View>

      <View style={[styles.card, { borderRadius: radius }]}>
        {documents.map((item, index) => (
          <DocumentRowMemo key={item.id} item={item} showDivider={index > 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: '100%',
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 2,
  },
  groupLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    letterSpacing: 0.9,
    color: colors.muted,
  },
  fileCount: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.muted,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  scanning: {
    alignItems: 'center',
    gap: 10,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    textAlign: 'center',
  },
  rowPad: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
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
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.sand,
    flexShrink: 0,
    marginTop: 2,
  },
  badgeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.4,
    color: colors.forest,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  viewLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryForeground,
  },
  downloadBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  downloadBusy: {
    opacity: 0.9,
  },
  downloadLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.78,
  },
});
