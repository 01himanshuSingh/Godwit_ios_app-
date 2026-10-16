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

/** Date label + card of trips (underline between rows only — matches yacht mock). */
export function UpcomingDayCard({ group, onTripPress }: UpcomingDayCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.dateHeader}>{group.label}</Text>
      <View style={styles.card}>
        {group.trips.map((trip, index) => (
          <UpcomingTripRow
            key={trip.saleId}
            trip={trip}
            showBottomLine={index < group.trips.length - 1}
            onPress={onTripPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  dateHeader: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.forest,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
