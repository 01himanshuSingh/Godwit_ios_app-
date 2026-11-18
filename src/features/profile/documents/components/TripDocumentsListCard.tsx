/**
 * Trips tab — destination groups · white card rows · View / Download.
 * CRM TripDocumentItem fields only.
 */
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { TripDocumentIconKind, TripDocumentItem } from '@/lib/firebase/documents';
import { downloadSaleVoucherPdf, openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TripDocumentsListCardProps = {
  documents: TripDocumentItem[];
  isScanning?: boolean;
};

type DocGroup = {
  label: string;
  items: TripDocumentItem[];
};

function groupDocuments(documents: TripDocumentItem[]): DocGroup[] {
  const map = new Map<string, TripDocumentItem[]>();
  for (const doc of documents) {
    const key = doc.groupLabel.trim() || 'Trips';
    const list = map.get(key) ?? [];
    list.push(doc);
    map.set(key, list);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}

function ServiceIcon({ kind }: { kind: TripDocumentIconKind }) {
  if (kind === 'stay') {
    return <MaterialCommunityIcons name="bed-outline" size={18} color={colors.forest} />;
  }
  if (kind === 'flight') {
    return <MaterialCommunityIcons name="airplane" size={18} color={colors.forest} />;
  }
  if (kind === 'tour') {
    return <Feather name="map" size={17} color={colors.forest} />;
  }
  return <Feather name="file-text" size={17} color={colors.forest} />;
}

function fileCountLabel(count: number): string {
  return count === 1 ? '1 File' : `${count} Files`;
}

function DocumentRow({ item, showDivider }: { item: TripDocumentItem; showDivider: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const meta = item.metaLine || item.travelDateLabel;

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={styles.rowPad}>
        <View style={styles.topRow}>
          <View style={styles.iconWell}>
            <ServiceIcon kind={item.iconKind} />
          </View>

          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
            {meta ? (
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
                {meta}
              </Text>
            ) : null}
          </View>

          {item.badgeLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{item.badgeLabel}</Text>
            </View>
          ) : null}
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

export function TripDocumentsListCard({
  documents,
  isScanning = false,
}: TripDocumentsListCardProps) {
  const { width } = useWindowDimensions();
  const radius = width < 360 ? 18 : 20;
  const groups = useMemo(() => groupDocuments(documents), [documents]);

  if (documents.length === 0) {
    return (
      <View style={[styles.emptyCard, { borderRadius: radius }]}>
        {isScanning ? (
          <View style={styles.scanning}>
            <ActivityIndicator color={colors.forest} />
            <Text style={styles.empty}>Looking for trip documents…</Text>
          </View>
        ) : (
          <Text style={styles.empty}>No trip confirmations uploaded yet.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel} numberOfLines={1}>
              {group.label.toUpperCase()}
            </Text>
            <Text style={styles.fileCount}>{fileCountLabel(group.items.length)}</Text>
          </View>

          <View style={[styles.card, { borderRadius: radius }]}>
            {group.items.map((item, index) => (
              <DocumentRowMemo
                key={`${item.saleId}-${item.documentPath}`}
                item={item}
                showDivider={index > 0}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: 18,
  },
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
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
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
