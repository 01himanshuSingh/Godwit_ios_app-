/**
 * Home trip spotlight — current cluster, or upcoming when none current.
 * Mock: cover + title + dates + party + place + next + service icons + View trip.
 */
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeContentInset } from '@/features/home/layout/homeContentInset';
import type {
  ClientCurrentTripCard,
  CurrentTripServiceIcon,
} from '@/lib/firebase/sales/currentTrip';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type CurrentTripCardProps = {
  card: ClientCurrentTripCard;
  onViewTrip?: (primarySaleId: string, saleIds: string[]) => void;
};

function ServiceIcon({ icon }: { icon: CurrentTripServiceIcon }) {
  const tint = colors.muted;
  switch (icon) {
    case 'private-jet':
    case 'flight':
      return <Ionicons name="airplane-outline" size={18} color={tint} />;
    case 'villa':
      return <Feather name="home" size={17} color={tint} />;
    case 'chauffeur':
      return <Ionicons name="car-outline" size={18} color={tint} />;
    case 'yacht':
      return <Ionicons name="boat-outline" size={18} color={tint} />;
    case 'vip':
      return <Ionicons name="people-outline" size={18} color={tint} />;
    case 'experience':
      return <Ionicons name="star-outline" size={17} color={tint} />;
    default:
      return <Feather name="briefcase" size={16} color={tint} />;
  }
}

export function CurrentTripCard({ card, onViewTrip }: CurrentTripCardProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);

  return (
    <View style={[styles.section, { paddingHorizontal: inset }]}>
      <Text style={styles.sectionLabel}>{card.sectionLabel}</Text>

      <View style={styles.card}>
        <Image
          source={{ uri: card.coverUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={`${card.title} cover`}
        />

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {card.title}
          </Text>
          <Text style={styles.meta} numberOfLines={2} ellipsizeMode="tail">
            {card.dateSummary}
          </Text>
          <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
            {card.partySummary}
          </Text>
          {card.placeLine ? (
            <Text style={styles.stay} numberOfLines={2} ellipsizeMode="tail">
              {card.placeLine}
            </Text>
          ) : null}

          <View style={styles.divider} />

          {card.nextUp ? (
            <Text style={styles.nextLine} numberOfLines={2} ellipsizeMode="tail">
              <Text style={styles.nextPrefix}>Next — </Text>
              <Text style={styles.nextValue}>{card.nextUp.displayLabel}</Text>
            </Text>
          ) : null}

          {card.services.length > 0 ? (
            <View style={styles.services}>
              {card.services.map((service) => (
                <View key={service.id} style={styles.serviceItem}>
                  <ServiceIcon icon={service.icon} />
                  <Text style={styles.serviceLabel}>{service.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View trip"
            onPress={() => onViewTrip?.(card.primarySaleId, card.saleIds)}
            hitSlop={8}
            style={styles.viewTripHit}
          >
            <View style={styles.viewTripRow}>
              <Text style={styles.viewTripLabel} numberOfLines={1}>
                View trip
              </Text>
              <Feather name="arrow-right" size={16} color={colors.forest} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Empty state when the client has no current or upcoming trip. */
export function CurrentTripEmptyCard() {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);

  return (
    <View style={[styles.section, { paddingHorizontal: inset }]}>
      <Text style={styles.sectionLabel}>CURRENT TRIP</Text>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No trips arranged yet</Text>
        <Text style={styles.emptyBody}>Send a New request and your trip will show here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#1B2915',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    shadowColor: '#1B2915',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 24,
    lineHeight: 30,
    color: colors.forest,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.surface,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
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
  viewTripHit: {
    alignSelf: 'flex-start',
  },
  viewTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  viewTripLabel: {
    flexShrink: 0,
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.forest,
  },
});
