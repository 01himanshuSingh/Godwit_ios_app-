import { StyleSheet, Text, View } from 'react-native';

import { UpcomingTripRow } from '@/features/trips/components/UpcomingTripRow';
import type { UpcomingDayGroup } from '@/features/trips/utils/upcomingTripsUi';
import type { ClientSaleTrip } from '@/lib/firebase/sales/getClientUpcomingSales';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type UpcomingDayCardProps = {
  group: UpcomingDayGroup;
  onTripPress?: (trip: ClientSaleTrip) => void;
};

/** Date label + white card of trips, each trip with a bottom underline. */
export function UpcomingDayCard({ group, onTripPress }: UpcomingDayCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.dateHeader}>{group.label}</Text>
      <View style={styles.card}>
        {group.trips.map((trip) => (
          <UpcomingTripRow key={trip.saleId} trip={trip} showBottomLine onPress={onTripPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  dateHeader: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
