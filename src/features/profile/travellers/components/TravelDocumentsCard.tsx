/**
 * Expandable Travel Documents card — passport / visa / membership rows.
 * Status badge: Valid | Renew soon | Expired | Unknown.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';

import type { TravelDocItem, TravellerTravelDocs } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TravelDocumentsCardProps = {
  travelDocs: TravellerTravelDocs;
  initiallyExpanded?: boolean;
};

function layoutForWidth(width: number) {
  if (width < 360) {
    return {
      padH: 18,
      padV: 16,
      radius: 18,
      sectionLabelSize: 11,
      summarySize: 14,
      summaryLineHeight: 20,
      titleSize: 15,
      titleLineHeight: 20,
      metaSize: 13,
      metaLineHeight: 18,
      badgeSize: 12,
      chevronSize: 18,
      rowGap: 4,
      footerSize: 12,
    };
  }
  return {
    padH: 22,
    padV: 18,
    radius: 20,
    sectionLabelSize: 11,
    summarySize: 15,
    summaryLineHeight: 22,
    titleSize: 16,
    titleLineHeight: 22,
    metaSize: 14,
    metaLineHeight: 20,
    badgeSize: 12,
    chevronSize: 20,
    rowGap: 5,
    footerSize: 13,
  };
}

function DocRow({
  item,
  layout,
  showDivider,
}: {
  item: TravelDocItem;
  layout: ReturnType<typeof layoutForWidth>;
  showDivider: boolean;
}) {
  const openDoc = () => {
    const url = item.docUrl?.trim();
    if (!url) return;
    void Linking.openURL(url);
  };

  return (
    <View>
      {showDivider ? <View style={styles.rowDivider} /> : null}
      <Pressable
        accessibilityRole={item.docUrl ? 'link' : 'none'}
        accessibilityLabel={item.title}
        disabled={!item.docUrl}
        onPress={openDoc}
        style={({ pressed }) => [styles.row, pressed && item.docUrl ? styles.pressed : null]}
      >
        <View style={[styles.rowText, { gap: layout.rowGap }]}>
          <View style={styles.titleLine}>
            <Text
              style={[
                styles.docTitle,
                {
                  fontSize: layout.titleSize,
                  lineHeight: layout.titleLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusLabel, { fontSize: layout.badgeSize }]} numberOfLines={1}>
                {item.status}
              </Text>
            </View>
          </View>
          {item.detailLine ? (
            <Text
              style={[
                styles.meta,
                {
                  fontSize: layout.metaSize,
                  lineHeight: layout.metaLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.detailLine}
            </Text>
          ) : null}
          {item.expiresAtLabel ? (
            <Text
              style={[
                styles.meta,
                {
                  fontSize: layout.metaSize,
                  lineHeight: layout.metaLineHeight,
                },
              ]}
              numberOfLines={1}
            >
              {item.expiresAtLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export function TravelDocumentsCard({
  travelDocs,
  initiallyExpanded = true,
}: TravelDocumentsCardProps) {
  const { width } = useWindowDimensions();
  const layout = useMemo(() => layoutForWidth(width), [width]);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const summary = travelDocs.summaryLine || '0 on file · numbers always masked';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Travel documents"
        onPress={toggle}
        hitSlop={8}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text
          style={[styles.sectionLabel, { fontSize: layout.sectionLabelSize, letterSpacing: 0.8 }]}
        >
          TRAVEL DOCUMENTS
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryTextWrap}>
            <Text
              style={[
                styles.summary,
                {
                  fontSize: layout.summarySize,
                  lineHeight: layout.summaryLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {summary}
            </Text>
          </View>
          <View style={styles.chevronWrap} pointerEvents="none">
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={layout.chevronSize}
              color="#C4C0B8"
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.divider} />
          {travelDocs.items.length === 0 ? (
            <Text style={styles.empty}>No travel documents on file yet.</Text>
          ) : (
            travelDocs.items.map((item, index) => (
              <DocRow key={item.id} item={item} layout={layout} showDivider={index > 0} />
            ))
          )}
          <Text
            style={[
              styles.footer,
              {
                fontSize: layout.footerSize,
                marginTop: travelDocs.items.length === 0 ? 12 : 16,
              },
            ]}
          >
            A new or renewed document is uploaded securely by your Godwit team — request the change
            below.
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    width: '100%',
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  summaryTextWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  summary: {
    width: '100%',
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  chevronWrap: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 16,
    marginBottom: 4,
  },
  row: {
    paddingVertical: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8E6E1',
  },
  statusLabel: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.muted,
  },
  meta: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
  },
  footer: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.75,
  },
});
