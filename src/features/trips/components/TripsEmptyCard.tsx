/**
 * Empty Trips tab card — icon + serif title + body + outline New request CTA.
 * Visual styles on View; Pressable is a plain touch wrapper.
 */
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { TripsListMode } from '@/lib/firebase/sales/getClientUpcomingSales';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TripsEmptyCardProps = {
  mode: TripsListMode;
  onNewRequest?: () => void;
};

function copyForMode(mode: TripsListMode): { title: string; body: string } {
  switch (mode) {
    case 'current':
      return {
        title: 'No current trips for this client.',
        body: 'Active itineraries in progress will appear here.',
      };
    case 'past':
      return {
        title: 'No past trips for this client.',
        body: 'Completed itineraries and travel vouchers will be archived here.',
      };
    case 'upcoming':
    default:
      return {
        title: 'No upcoming trips for this client.',
        body: 'Confirmed bookings and travel arrangements will appear here.',
      };
  }
}

export function TripsEmptyCard({ mode, onNewRequest }: TripsEmptyCardProps) {
  const { width } = useWindowDimensions();
  const pagePad = width < 360 ? 16 : width >= 768 ? 32 : 20;
  const { title, body } = copyForMode(mode);

  return (
    <View style={[styles.wrap, { paddingHorizontal: pagePad }]}>
      <View style={styles.card}>
        <View style={styles.iconWell}>
          <Feather name="briefcase" size={22} color={colors.forest} />
        </View>

        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New request"
          onPress={onNewRequest}
          style={styles.pressable}
        >
          <View style={styles.cta}>
            <Text style={styles.ctaLabel}>New request</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: 28,
    justifyContent: 'flex-start',
  },
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
    gap: 12,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    marginBottom: 4,
  },
  title: {
    alignSelf: 'stretch',
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 18,
    lineHeight: 22,
    color: colors.forest,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
  },
  pressable: {
    marginTop: 8,
  },
  cta: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.forest,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  ctaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    color: colors.forest,
  },
});
