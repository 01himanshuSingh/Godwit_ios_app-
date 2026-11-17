/**
 * Trips list service row.
 * Icon + type + status (top) → title → detail. No time.
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { serviceTypeListLabel, tripTitle } from '@/features/trips/utils/upcomingTripsUi';
import type { ClientSaleTrip, SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingTripRowProps = {
  trip: ClientSaleTrip;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: (trip: ClientSaleTrip) => void;
};

function ServiceGlyph({ type }: { type: SaleServiceType }) {
  const tint = colors.forest;
  const size = 16;
  switch (type) {
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return <Ionicons name="airplane-outline" size={size} color={tint} />;
    case 'privateJet':
      return <Ionicons name="airplane" size={size} color={tint} />;
    case 'yacht':
      return <Ionicons name="boat-outline" size={size} color={tint} />;
    case 'vip':
      return <Ionicons name="star-outline" size={size} color={tint} />;
    case 'chauffeur':
      return <Ionicons name="car-outline" size={size} color={tint} />;
    case 'hotel':
    case 'hotelRoomExtension':
      return <Ionicons name="bed-outline" size={size} color={tint} />;
    case 'visa':
      return <Ionicons name="document-text-outline" size={size} color={tint} />;
    case 'experiences':
      return <Ionicons name="compass-outline" size={size} color={tint} />;
    default:
      return <Feather name="briefcase" size={size} color={tint} />;
  }
}

export function UpcomingTripRow({ trip, isLast = false, onPress }: UpcomingTripRowProps) {
  const title = trip.displayTitle?.trim() || tripTitle(trip);
  const typeLabel = serviceTypeListLabel(trip.serviceType);
  const detail = trip.detailLine?.trim() || null;
  const status = trip.statusLabel;
  const isConfirmed = status === 'Confirmed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}, ${title}`}
      onPress={() => onPress?.(trip)}
      style={styles.pressable}
    >
      <View style={[styles.row, !isLast && styles.rowDivider]}>
        <View style={styles.content}>
          <View style={styles.typeRow}>
            <View style={styles.typeLeading}>
              <View style={styles.iconWell}>
                <ServiceGlyph type={trip.serviceType} />
              </View>
              <Text style={styles.typeLabel} numberOfLines={1}>
                {typeLabel}
              </Text>
            </View>
            <View style={styles.typeTrailing}>
              {status ? (
                <View
                  style={[styles.badge, isConfirmed ? styles.badgeConfirmed : styles.badgeMuted]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isConfirmed ? styles.badgeTextConfirmed : styles.badgeTextMuted,
                    ]}
                    numberOfLines={1}
                  >
                    {status}
                  </Text>
                </View>
              ) : null}
              <Feather name="chevron-right" size={16} color={colors.border} />
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {detail ? (
            <Text style={styles.detail} numberOfLines={2}>
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  row: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  content: {
    gap: 6,
    minWidth: 0,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
  },
  typeLeading: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
    marginLeft: 'auto',
  },
  iconWell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
  typeLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: colors.muted,
  },
  title: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 19,
    lineHeight: 24,
    color: colors.forest,
  },
  detail: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  badge: {
    flexShrink: 0,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  badgeConfirmed: {
    backgroundColor: colors.sand,
  },
  badgeMuted: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    lineHeight: 13,
  },
  badgeTextConfirmed: {
    color: colors.forest,
  },
  badgeTextMuted: {
    color: colors.muted,
  },
});
