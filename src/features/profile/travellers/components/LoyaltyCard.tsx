/**
 * Expandable Loyalty card — programme rows from CRM memberships.
 * Only renders fields present on TravellerLoyaltyRow.
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

import type { TravellerLoyalty, TravellerLoyaltyRow } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LoyaltyCardProps = {
  loyalty: TravellerLoyalty;
  initiallyExpanded?: boolean;
};

function LoyaltyProgramCard({ row }: { row: TravellerLoyaltyRow }) {
  const hasFooter = Boolean(row.memberName?.trim() || row.memberNumberMasked?.trim());

  return (
    <View style={styles.programCard}>
      <View style={styles.accentBar} />
      <View style={styles.programBody}>
        <View style={styles.programTop}>
          <Text style={styles.programName} numberOfLines={2}>
            {row.programName}
          </Text>
          {row.tier?.trim() ? (
            <View style={styles.tierBadge}>
              <Text style={styles.tierLabel} numberOfLines={1}>
                {row.tier.trim()}
              </Text>
            </View>
          ) : null}
        </View>

        {hasFooter ? (
          <View style={styles.programBottom}>
            {row.memberName?.trim() ? (
              <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                {row.memberName.trim()}
              </Text>
            ) : (
              <View style={styles.memberNameSpacer} />
            )}
            {row.memberNumberMasked?.trim() ? (
              <Text style={styles.memberNumber} numberOfLines={1}>
                {row.memberNumberMasked.trim()}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function LoyaltyCard({ loyalty, initiallyExpanded = true }: LoyaltyCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const summary = loyalty.summaryLine?.trim() || null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Loyalty"
        onPress={toggle}
        hitSlop={8}
        style={styles.headerPressable}
      >
        <View style={styles.headerTop}>
          <Text style={styles.sectionLabel}>LOYALTY</Text>
          <View style={styles.headerTrailing}>
            <View style={styles.managedBadge}>
              <Feather name="lock" size={9} color={colors.forest} />
              <Text style={styles.managedLabel}>Managed by Godwit</Text>
            </View>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#C4C0B8" />
          </View>
        </View>
        {summary ? (
          <Text style={styles.summary} numberOfLines={2} ellipsizeMode="tail">
            {summary}
          </Text>
        ) : null}
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {loyalty.rows.length === 0 ? (
            <Text style={styles.empty}>No loyalty programmes linked yet.</Text>
          ) : (
            <View style={styles.list}>
              {loyalty.rows.map((row) => (
                <LoyaltyProgramCard key={row.id} row={row} />
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Feather name="shield" size={13} color={colors.muted} />
            <Text style={styles.footerText}>
              Membership numbers are added and verified by your Godwit team.
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
    backgroundColor: colors.card,
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
  list: {
    gap: 10,
  },
  programCard: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.forest,
  },
  programBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  programTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  programName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },
  tierBadge: {
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: colors.sand,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tierLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.forest,
  },
  programBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  memberName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
  },
  memberNameSpacer: {
    flex: 1,
  },
  memberNumber: {
    flexShrink: 0,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    letterSpacing: 0.4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
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
