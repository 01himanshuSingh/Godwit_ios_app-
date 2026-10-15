import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { serviceTypeListLabel, tripTitle } from '@/features/trips/utils/upcomingTripsUi';
import type { ClientSaleTrip, SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingTripRowProps = {
  trip: ClientSaleTrip;
  /** Bottom underline under every trip (including last in the card). */
  showBottomLine?: boolean;
  onPress?: (trip: ClientSaleTrip) => void;
};

function ServiceGlyph({ type }: { type: SaleServiceType }) {
  const tint = colors.muted;
  switch (type) {
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return <Ionicons name="airplane-outline" size={14} color={tint} />;
    case 'privateJet':
      return <Ionicons name="airplane" size={14} color={tint} />;
    case 'vip':
      return <Ionicons name="star-outline" size={14} color={tint} />;
    case 'chauffeur':
      return <Ionicons name="car-outline" size={14} color={tint} />;
    case 'hotel':
    case 'hotelRoomExtension':
      return <Ionicons name="bed-outline" size={14} color={tint} />;
    case 'visa':
      return <Ionicons name="document-text-outline" size={14} color={tint} />;
    case 'experiences':
      return <Ionicons name="compass-outline" size={14} color={tint} />;
    default:
      return <Feather name="briefcase" size={13} color={tint} />;
  }
}

export function UpcomingTripRow({ trip, showBottomLine = true, onPress }: UpcomingTripRowProps) {
  const title = tripTitle(trip);
  const typeLabel = serviceTypeListLabel(trip.serviceType);
  const time = trip.displayTime ?? '—';
  const detail = trip.detailLine;
  const status = trip.statusLabel;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}, ${title}`}
      onPress={() => onPress?.(trip)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.inner, showBottomLine && styles.innerUnderline]}>
        <Text style={styles.time}>{time}</Text>

        <View style={styles.body}>
          <View style={styles.typeRow}>
            <ServiceGlyph type={trip.serviceType} />
            <Text style={styles.typeLabel}>{typeLabel}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {detail ? (
            <Text style={styles.detail} numberOfLines={2}>
              {detail}
            </Text>
          ) : null}
          {status ? (
            <Text style={status === 'Confirmed' ? styles.confirmed : styles.cancelled}>
              {status}
            </Text>
          ) : null}
        </View>

        <Feather name="chevron-right" size={18} color={colors.border} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'transparent',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  innerUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  time: {
    width: 44,
    marginTop: 2,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
  body: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  typeLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.forest,
  },
  detail: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  confirmed: {
    marginTop: 4,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
  cancelled: {
    marginTop: 4,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
  chevron: {
    marginTop: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
