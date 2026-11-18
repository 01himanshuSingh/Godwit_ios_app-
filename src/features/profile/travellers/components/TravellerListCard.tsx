/**
 * Travellers list — single white card, avatar · name · badges · meta · chevron.
 * Only renders fields present on ClientTraveller (no invented identity).
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClientTraveller } from '@/lib/firebase/customers';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerListCardProps = {
  travellers: ClientTraveller[];
  onPressTraveller?: (traveller: ClientTraveller) => void;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

function isPrincipalRelationship(relationship: string | null | undefined): boolean {
  const r = relationship?.trim().toLowerCase() ?? '';
  return r === 'principal' || r.includes('principal');
}

function TravellerRow({
  traveller,
  isLast,
  onPress,
}: {
  traveller: ClientTraveller;
  isLast: boolean;
  onPress?: (traveller: ClientTraveller) => void;
}) {
  const name = traveller.name?.trim() ?? '';
  const detail = traveller.detailLine?.trim() || null;
  const showPrincipal = isPrincipalRelationship(traveller.relationship);
  const showMinor = traveller.isMinor === true;
  const initials = initialsFromName(name);
  const a11y = name || detail || 'Traveller';

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPress={() => onPress?.(traveller)}
        style={styles.rowPressable}
      >
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>

          <View style={styles.copyCol}>
            <View style={styles.nameLine}>
              {name ? (
                <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                  {name}
                </Text>
              ) : null}

              {showPrincipal ? (
                <View style={styles.principalBadge}>
                  <Text style={styles.principalBadgeLabel}>PRINCIPAL</Text>
                </View>
              ) : null}

              {showMinor ? (
                <View style={styles.minorBadge}>
                  <Text style={styles.minorBadgeLabel}>MINOR</Text>
                </View>
              ) : null}
            </View>

            {detail ? (
              <Text style={styles.detail} numberOfLines={2} ellipsizeMode="tail">
                {detail}
              </Text>
            ) : null}
          </View>

          <Feather name="chevron-right" size={16} color="#C4C0B8" style={styles.chevron} />
        </View>
      </Pressable>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function TravellerListCard({ travellers, onPressTraveller }: TravellerListCardProps) {
  if (travellers.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      {travellers.map((traveller, index) => (
        <TravellerRow
          key={traveller.customerId}
          traveller={traveller}
          isLast={index === travellers.length - 1}
          onPress={onPressTraveller}
        />
      ))}
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
    overflow: 'hidden',
  },
  rowPressable: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
  avatarInitials: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 14,
    lineHeight: 17,
    color: colors.forest,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 17,
    lineHeight: 22,
    color: colors.forest,
  },
  principalBadge: {
    borderRadius: 999,
    backgroundColor: colors.sand,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  principalBadgeLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: colors.forest,
  },
  minorBadge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  minorBadgeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: colors.forest,
  },
  detail: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
  },
  chevron: {
    marginTop: 1,
  },
  divider: {
    marginLeft: 78,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
