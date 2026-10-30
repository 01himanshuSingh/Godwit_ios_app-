/**
 * Personal tab list — passports / visas / memberships with View + Download.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { PersonalDocumentItem } from '@/lib/firebase/documents';
import { downloadSaleVoucherPdf, openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type PersonalDocumentsListCardProps = {
  documents: PersonalDocumentItem[];
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 16,
      padV: 14,
      radius: 18,
      sectionSize: 11,
      titleSize: 14,
      metaSize: 12,
      actionSize: 13,
      iconSize: 16,
    };
  }
  return {
    padH: 20,
    padV: 16,
    radius: 20,
    sectionSize: 12,
    titleSize: 15,
    metaSize: 13,
    actionSize: 14,
    iconSize: 18,
  };
}

function DocumentRow({
  item,
  layout,
  showDivider,
}: {
  item: PersonalDocumentItem;
  layout: ReturnType<typeof layoutForWidth>;
  showDivider: boolean;
}) {
  const [downloading, setDownloading] = useState(false);

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={styles.row}>
        <Feather name="file-text" size={layout.iconSize} color={colors.muted} style={styles.icon} />
        <View style={styles.textCol}>
          <Text
            style={[styles.title, { fontSize: layout.titleSize }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          {item.metaLine ? (
            <Text style={[styles.meta, { fontSize: layout.metaSize }]} numberOfLines={1}>
              {item.metaLine}
            </Text>
          ) : null}
          <Text style={[styles.label, { fontSize: layout.metaSize }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${item.title}`}
          onPress={() => void openSaleVoucherPdf(item.url)}
          hitSlop={8}
          style={({ pressed }) => [styles.actionHit, pressed && styles.pressed]}
        >
          <Text style={[styles.action, { fontSize: layout.actionSize }]}>View</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Download ${item.title}`}
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
          hitSlop={8}
          style={({ pressed }) => [styles.actionHit, pressed && styles.pressed]}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Text style={[styles.action, { fontSize: layout.actionSize }]}>Download</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function PersonalDocumentsListCard({ documents }: PersonalDocumentsListCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);

  if (documents.length === 0) {
    return (
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
        <Text style={styles.empty}>No personal documents uploaded yet.</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius,
          paddingHorizontal: layout.padH,
          paddingTop: layout.padV,
          paddingBottom: layout.padV,
        },
      ]}
    >
      <Text style={[styles.sectionLabel, { fontSize: layout.sectionSize }]}>PERSONAL</Text>
      {documents.map((item, index) => (
        <DocumentRow key={item.id} item={item} layout={layout} showDivider={index > 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  icon: {
    marginTop: 1,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  meta: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  label: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  actionHit: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  action: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
