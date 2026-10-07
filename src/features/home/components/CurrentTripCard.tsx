import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { HomeCurrentTrip } from '@/features/home/schemas/homeViewModel';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CurrentTripCardProps = {
  trip: HomeCurrentTrip;
};

export function CurrentTripCard({ trip }: CurrentTripCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>YOUR CURRENT TRIP</Text>
      <View style={styles.card}>
        <Image
          source={{ uri: trip.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={
            trip.destination ? `Current trip, ${trip.destination}` : 'Current trip destination'
          }
        />
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
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
});
