/**
 * Expandable Travel Documents — nested doc cards with status pills.
 * Only renders fields present on TravelDocItem (real CRM data).
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import type { TravelDocItem, TravelDocStatus, TravellerTravelDocs } from '@/lib/firebase/customers';
import { openDocumentInApp } from '@/lib/documents/documentFileActions';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TravelDocumentsCardProps = {
  travelDocs: TravellerTravelDocs;
  initiallyExpanded?: boolean;
};

function StatusBadge({ status }: { status: TravelDocStatus }) {
  if (status === 'Valid') {
    return (
      <View style={[styles.badge, styles.badgeValid]}>
        <Text style={styles.badgeValidLabel}>Valid</Text>
      </View>
    );
  }
  if (status === 'Renew soon') {
    return (
      <View style={[styles.badge, styles.badgeRenew]}>
        <Feather name="clock" size={9} color={colors.forest} />
        <Text style={styles.badgeRenewLabel}>Renew soon</Text>
      </View>
    );
  }
  if (status === 'Expired') {
    return (
      <View style={[styles.badge, styles.badgeExpired]}>
        <Text style={styles.badgeExpiredLabel}>Expired</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeUnknown]}>
      <Text style={styles.badgeUnknownLabel}>Unknown</Text>
    </View>
  );
}

function DocItemCard({ item }: { item: TravelDocItem }) {
  const canOpen = Boolean(item.docUrl?.trim());
  const openDoc = () => {
    const url = item.docUrl?.trim();
    if (!url) return;
    void openDocumentInApp(url, item.title?.trim() || 'Travel document');
  };

  const content = (
    <View style={styles.docCard}>
      <View style={styles.docIcon}>
        <Feather name="file-text" size={16} color={colors.forest} />
      </View>

      <View style={styles.docCopy}>
        <Text style={styles.docTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.country?.trim() || item.maskedNumber?.trim() ? (
          <Text style={styles.docMeta} numberOfLines={1} ellipsizeMode="tail">
            {item.country?.trim() ? (
              <Text style={styles.docMetaCountry}>{item.country.trim()}</Text>
            ) : null}
            {item.country?.trim() && item.maskedNumber?.trim() ? (
              <Text style={styles.docMetaCountry}> </Text>
            ) : null}
            {item.maskedNumber?.trim() ? (
              <Text style={styles.docMetaNumber}>{item.maskedNumber.trim()}</Text>
            ) : null}
          </Text>
        ) : item.detailLine ? (
          <Text style={styles.docMeta} numberOfLines={1} ellipsizeMode="tail">
            {item.detailLine}
          </Text>
        ) : null}
        {item.expiresAtLabel ? (
          <Text
            style={[styles.docExpiry, item.status === 'Expired' && styles.docExpiryExpired]}
            numberOfLines={1}
          >
            {item.expiresAtLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.docTrailing}>
        <StatusBadge status={item.status} />
        {canOpen ? <Feather name="chevron-right" size={16} color="#C4C0B8" /> : null}
      </View>
    </View>
  );

  if (!canOpen) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${item.title}. ${item.status}`}
      onPress={openDoc}
    >
      {content}
    </Pressable>
  );
}

export function TravelDocumentsCard({
  travelDocs,
  initiallyExpanded = true,
}: TravelDocumentsCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const summary = travelDocs.summaryLine?.trim() || null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Travel documents"
        onPress={toggle}
        hitSlop={8}
        style={styles.headerPressable}
      >
        <View style={styles.headerTop}>
          <Text style={styles.sectionLabel}>TRAVEL DOCUMENTS</Text>
          <View style={styles.headerTrailing}>
            <View style={styles.managedBadge}>
              <Feather name="lock" size={9} color={colors.forest} />
              <Text style={styles.managedLabel}>Managed by Godwit</Text>
            </View>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#C4C0B8" />
          </View>
        </View>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {travelDocs.items.length === 0 ? (
            <Text style={styles.empty}>No travel documents on file yet.</Text>
          ) : (
            <View style={styles.docList}>
              {travelDocs.items.map((item) => (
                <DocItemCard key={item.id} item={item} />
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Feather name="info" size={13} color={colors.muted} />
            <Text style={styles.footerText}>
              A new or renewed document is uploaded securely by your Godwit team — request the
              change below.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerPressable: {
    width: '100%',
    gap: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 0.9,
    color: colors.muted,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  managedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: colors.sand,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  managedLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  summary: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  body: {
    marginTop: 14,
    gap: 12,
  },
  docList: {
    gap: 10,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
  docCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  docTitle: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  docMeta: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  docMetaCountry: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  docMetaNumber: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  docExpiry: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  docExpiryExpired: {
    color: '#8B3A3A',
  },
  docTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeValid: {
    backgroundColor: colors.sand,
  },
  badgeValidLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  badgeRenew: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
  },
  badgeRenewLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  badgeExpired: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8B3A3A',
  },
  badgeExpiredLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: '#8B3A3A',
  },
  badgeUnknown: {
    backgroundColor: colors.surface,
  },
  badgeUnknownLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
  },
  footerText: {
    flex: 1,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  empty: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    color: colors.muted,
    paddingVertical: 8,
  },
});
