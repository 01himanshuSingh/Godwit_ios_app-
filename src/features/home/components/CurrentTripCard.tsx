/**
 * Home trip spotlight — current cluster, or upcoming when none current.
 * UI layout only; data from ClientCurrentTripCard (same backend mapper).
 * Visual styles on View; Pressable is a plain touch wrapper only.
 */
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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

function ServiceIcon({ icon, size = 15 }: { icon: CurrentTripServiceIcon; size?: number }) {
  const tint = colors.forest;
  switch (icon) {
    case 'private-jet':
    case 'flight':
      return <Ionicons name="airplane-outline" size={size} color={tint} />;
    case 'villa':
      return <Feather name="home" size={size} color={tint} />;
    case 'chauffeur':
      return <Ionicons name="car-outline" size={size} color={tint} />;
    case 'yacht':
      return <Ionicons name="boat-outline" size={size} color={tint} />;
    case 'vip':
      return <Ionicons name="people-outline" size={size} color={tint} />;
    case 'experience':
      return <Ionicons name="star-outline" size={size} color={tint} />;
    default:
      return <Feather name="briefcase" size={size - 1} color={tint} />;
  }
}

function formatWeekdayShortDate(isoKey: string): string {
  const d = new Date(`${isoKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoKey;
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatProgressEndLabel(isoKey: string, kind: 'arrived' | 'departure'): string {
  const d = new Date(`${isoKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return kind === 'arrived' ? `ARRIVED ${isoKey}` : `DEPARTURE ${isoKey}`;
  }
  const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return kind === 'arrived' ? `ARRIVED ${mon} ${day}` : `DEPARTURE ${mon} ${day}`;
}

function refLabel(saleId: string): string | null {
  const id = saleId.trim();
  if (!id) return null;
  const short = id.length > 14 ? id.slice(0, 12) : id;
  return `REF: ${short}`;
}

function progressRatio(card: ClientCurrentTripCard): number {
  if (card.mode !== 'current' || card.dayIndex == null || card.nights <= 0) return 0;
  const span = Math.max(card.nights, 1);
  return Math.min(1, Math.max(0, card.dayIndex / span));
}

export function CurrentTripCard({ card, onViewTrip }: CurrentTripCardProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);
  const ref = useMemo(() => refLabel(card.primarySaleId), [card.primarySaleId]);
  const progress = useMemo(() => progressRatio(card), [card]);

  const dateLine = useMemo(() => {
    const range = `${formatWeekdayShortDate(card.startDate)} – ${formatWeekdayShortDate(card.endDate)}`;
    if (card.nights <= 0) return range;
    const nightsPart = card.nights === 1 ? '1 night' : `${card.nights} nights`;
    return `${range} · ${nightsPart}`;
  }, [card.startDate, card.endDate, card.nights]);

  const partyLine = useMemo(() => {
    const travellers =
      card.travellerCount === 1 ? '1 traveller' : `${card.travellerCount} travellers`;
    const services =
      card.servicesCount === 1 ? '1 service active' : `${card.servicesCount} services active`;
    return `${travellers} · ${services}`;
  }, [card.travellerCount, card.servicesCount]);

  const showProgress = card.mode === 'current' && card.nights > 0;

  return (
    <View style={[styles.section, { paddingHorizontal: inset }]}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel} numberOfLines={1}>
            {card.sectionLabel}
          </Text>
          {ref ? (
            <Text style={styles.refLabel} numberOfLines={1}>
              {ref}
            </Text>
          ) : null}
        </View>

        <View style={styles.hero}>
          <Image
            source={card.coverSource}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={200}
            accessibilityLabel={`${card.title} cover`}
          />
          <View style={styles.heroScrim} pointerEvents="none" />

          {card.dayLabel ? (
            <View style={styles.dayBadge}>
              <View style={styles.dayDot} />
              <Text style={styles.dayBadgeText}>{card.dayLabel}</Text>
            </View>
          ) : null}

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle} numberOfLines={2} ellipsizeMode="tail">
              {card.title}
            </Text>
            {card.placeLine ? (
              <View style={styles.placeRow}>
                <Feather name="map-pin" size={12} color="rgba(255,255,255,0.88)" />
                <Text style={styles.placeText} numberOfLines={1} ellipsizeMode="tail">
                  {card.placeLine}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={15} color={colors.muted} />
              <Text style={styles.dateMetaText} numberOfLines={2} ellipsizeMode="tail">
                {dateLine}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={15} color={colors.muted} />
              <Text style={styles.partyMetaText} numberOfLines={1} ellipsizeMode="tail">
                {partyLine}
              </Text>
            </View>
          </View>

          {showProgress ? (
            <View style={styles.progressBlock}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  {formatProgressEndLabel(card.startDate, 'arrived')}
                </Text>
                <Text style={styles.progressLabel}>
                  {formatProgressEndLabel(card.endDate, 'departure')}
                </Text>
              </View>
            </View>
          ) : null}

          {card.nextUp ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Up next ${card.nextUp.displayLabel}`}
              onPress={() => onViewTrip?.(card.nextUp!.saleId, card.saleIds)}
              style={styles.pressable}
            >
              <View style={styles.upNext}>
                <View style={styles.upNextIcon}>
                  <Feather name="clock" size={16} color={colors.forest} />
                </View>
                <View style={styles.upNextCopy}>
                  <Text style={styles.upNextEyebrow}>UP NEXT</Text>
                  <Text style={styles.upNextTitle} numberOfLines={1} ellipsizeMode="tail">
                    {card.nextUp.displayLabel}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </View>
            </Pressable>
          ) : null}

          {card.services.length > 0 ? (
            <View style={styles.assetsBlock}>
              <Text style={styles.assetsLabel}>INCLUDED ITINERARY ASSETS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.assetsRow}
              >
                {card.services.map((service) => (
                  <View key={service.id} style={styles.assetChip}>
                    <ServiceIcon icon={service.icon} />
                    <Text style={styles.assetChipLabel} numberOfLines={1}>
                      {service.label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View trip"
            onPress={() => onViewTrip?.(card.primarySaleId, card.saleIds)}
            style={styles.pressable}
          >
            <View style={styles.viewTripBtn}>
              <Text style={styles.viewTripLabel}>View trip</Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type CurrentTripEmptyCardProps = {
  /** empty = no trip; error = backend/load failure with no card */
  variant?: 'empty' | 'error';
  onNewRequest?: () => void;
};

/** Empty / error state when there is no trip card to show. */
export function CurrentTripEmptyCard({
  variant = 'empty',
  onNewRequest,
}: CurrentTripEmptyCardProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);
  const isError = variant === 'error';

  return (
    <View style={[styles.section, { paddingHorizontal: inset }]}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptySectionLabel}>CURRENT TRIP</Text>
        <Text style={styles.emptyTitle}>
          {isError ? 'Couldn’t load your trip' : 'No trips arranged yet'}
        </Text>
        <Text style={styles.emptyBody}>
          {isError
            ? 'Something went wrong while loading. Send a New request or try again shortly.'
            : 'Send a New request and your trip will show here.'}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New request"
          onPress={onNewRequest}
          style={styles.pressable}
        >
          <View style={styles.emptyCta}>
            <Text style={styles.emptyCtaLabel}>New request</Text>
            <Feather name="arrow-right" size={14} color={colors.forest} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  pressable: {},
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.forest,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  refLabel: {
    flexShrink: 0,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  hero: {
    width: '100%',
    // Shorter cover than 16/11 — keeps the previous card layout, less image height.
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(12, 18, 10, 0.28)',
  },
  dayBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forest,
  },
  dayBadgeText: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
    color: colors.forest,
  },
  heroCopy: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 6,
    zIndex: 1,
  },
  heroTitle: {
    // Spec: 26 Semibold serif — Cormorant has no 600; Medium is closest.
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 26,
    lineHeight: 30,
    color: colors.primaryForeground,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  placeText: {
    flexShrink: 1,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 16,
  },
  metaBlock: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dateMetaText: {
    flex: 1,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  partyMetaText: {
    flex: 1,
    fontFamily: fontFamily.manrope.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.forest,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.muted,
  },
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  upNextIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  upNextCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  upNextEyebrow: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.muted,
  },
  upNextTitle: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
  assetsBlock: {
    gap: 10,
  },
  assetsLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    letterSpacing: 0.9,
    color: colors.muted,
  },
  assetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  assetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  assetChipLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    color: colors.forest,
  },
  viewTripBtn: {
    marginTop: 2,
    minHeight: 48,
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewTripLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    color: colors.primaryForeground,
  },
  emptyCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
    alignItems: 'center',
  },
  emptySectionLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 26,
    lineHeight: 32,
    color: colors.forest,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 18,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyCtaLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    color: colors.forest,
  },
});
