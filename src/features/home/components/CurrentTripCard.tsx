import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  HomeTripService,
  HomeUpcomingTripsSummary,
} from '@/features/home/schemas/homeViewModel';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CurrentTripCardProps = {
  trip: HomeUpcomingTripsSummary;
  onViewTrips?: () => void;
  /** Section eyebrow above the card. Hide on Trips screen (page title already covers it). */
  showSectionLabel?: boolean;
};

function ServiceIcon({ icon }: { icon: HomeTripService['icon'] }) {
  const tint = colors.muted;

  switch (icon) {
    case 'private-jet':
      return <Ionicons name="airplane-outline" size={18} color={tint} />;
    case 'villa':
      return <Feather name="home" size={17} color={tint} />;
    case 'chauffeur':
      return <Ionicons name="car-outline" size={18} color={tint} />;
    case 'yacht':
      return <Ionicons name="boat-outline" size={18} color={tint} />;
    default:
      return null;
  }
}

/**
 * Reusable booked-trips summary card (image + meta + services + View trips).
 * Saved for later surfaces — currently not mounted on Trips → Upcoming.
 */
export function CurrentTripCard({
  trip,
  onViewTrips,
  showSectionLabel = true,
}: CurrentTripCardProps) {
  return (
    <View style={[styles.section, !showSectionLabel && styles.sectionCompact]}>
      {showSectionLabel ? <Text style={styles.sectionLabel}>Your Upcoming Trips</Text> : null}

      <View style={styles.card}>
        <Image
          source={{ uri: trip.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel="Your upcoming trips summary"
        />

        <View style={styles.body}>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.meta}>{trip.dateSummary}</Text>
          <Text style={styles.meta}>{trip.partySummary}</Text>
          <Text style={styles.stay}>{trip.stayLabel}</Text>

          <View style={styles.divider} />

          <Text style={styles.nextLine}>
            <Text style={styles.nextPrefix}>Next — </Text>
            <Text style={styles.nextValue}>{trip.nextServiceLabel}</Text>
          </Text>

          <View style={styles.services}>
            {trip.services.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <ServiceIcon icon={service.icon} />
                <Text style={styles.serviceLabel}>{service.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View trips"
            onPress={onViewTrips}
            hitSlop={8}
            style={({ pressed }) => [styles.viewTrip, pressed && styles.pressed]}
          >
            <Text style={styles.viewTripLabel}>View trips</Text>
            <Feather name="arrow-right" size={16} color={colors.forest} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 14,
  },
  sectionCompact: {
    marginTop: 20,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    color: colors.muted,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
  },
  title: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 28,
    lineHeight: 34,
    color: colors.forest,
    marginBottom: 8,
  },
  meta: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  stay: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.forest,
    marginTop: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 16,
    marginBottom: 14,
  },
  nextLine: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  nextPrefix: {
    color: colors.muted,
  },
  nextValue: {
    fontFamily: fontFamily.manrope.medium,
    color: colors.forest,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 22,
    rowGap: 12,
    marginBottom: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  serviceLabel: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    color: colors.muted,
  },
  viewTrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  viewTripLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    color: colors.forest,
  },
  pressed: {
    opacity: 0.7,
  },
});
