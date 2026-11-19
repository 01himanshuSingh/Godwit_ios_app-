/**
 * Home loading skeleton — mirrors greeting → trip → quick actions → payments.
 */
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { homeContentInset } from '@/features/home/layout/homeContentInset';
import { colors } from '@/ui/tokens/colors';

type HomeScreenSkeletonProps = {
  /** When true, skip greeting bones (session greeting already rendered). */
  hideGreeting?: boolean;
  /** When true, only render the slim payments attention skeleton. */
  paymentsOnly?: boolean;
};

export function HomeScreenSkeleton({
  hideGreeting = false,
  paymentsOnly = false,
}: HomeScreenSkeletonProps) {
  const { width } = useWindowDimensions();
  const inset = useMemo(() => homeContentInset(width), [width]);

  if (paymentsOnly) {
    return (
      <View style={[styles.section, { paddingHorizontal: inset }]}>
        <PaymentsSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {!hideGreeting ? (
        <View style={[styles.greeting, { paddingHorizontal: inset }]}>
          <SkeletonBone style={styles.lineFamily} />
          <SkeletonBone style={styles.lineGreeting} />
          <SkeletonBone style={styles.lineUpdates} />
        </View>
      ) : null}

      <View style={[styles.section, { paddingHorizontal: inset }]}>
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <SkeletonBone style={styles.tripLabel} />
            <SkeletonBone style={styles.tripRef} />
          </View>

          <SkeletonBone style={styles.hero} />

          <View style={styles.tripBody}>
            <SkeletonBone style={styles.metaWide} />
            <SkeletonBone style={styles.metaMid} />

            <View style={styles.upNext}>
              <SkeletonBone style={styles.upNextFill} />
              <SkeletonBone style={styles.upNextDot} />
            </View>

            <View style={styles.chips}>
              <SkeletonBone style={styles.chip} />
              <SkeletonBone style={styles.chip} />
              <SkeletonBone style={styles.chip} />
              <SkeletonBone style={styles.chipShort} />
            </View>

            <SkeletonBone style={styles.cta} />
          </View>
        </View>
      </View>

      <View style={[styles.actionsRow, { paddingHorizontal: inset }]}>
        <View style={[styles.actionTile, styles.actionTilePrimary]}>
          <SkeletonBone style={styles.actionIcon} />
          <SkeletonBone style={styles.actionLabel} />
        </View>
        <View style={styles.actionTile}>
          <SkeletonBone style={styles.actionIcon} />
          <SkeletonBone style={styles.actionLabel} />
        </View>
      </View>

      <View style={[styles.section, { paddingHorizontal: inset }]}>
        <PaymentsSkeleton />
      </View>
    </View>
  );
}

function PaymentsSkeleton() {
  return (
    <View style={styles.paymentsBlock}>
      <SkeletonBone style={styles.paymentsEyebrow} />
      <View style={styles.paymentsCard}>
        <SkeletonBone style={styles.paymentsAvatar} />
        <View style={styles.paymentsCopy}>
          <SkeletonBone style={styles.paymentsLineWide} />
          <SkeletonBone style={styles.paymentsLineShort} />
        </View>
        <SkeletonBone style={styles.paymentsTrailing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 8,
  },
  greeting: {
    paddingTop: 22,
    gap: 10,
  },
  lineFamily: {
    width: '34%',
    height: 10,
    borderRadius: 5,
  },
  lineGreeting: {
    width: '72%',
    height: 22,
    borderRadius: 8,
    marginTop: 2,
  },
  lineUpdates: {
    width: '28%',
    height: 12,
    borderRadius: 6,
  },
  section: {
    marginTop: 18,
  },
  tripCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  tripLabel: {
    width: '42%',
    height: 10,
    borderRadius: 5,
  },
  tripRef: {
    width: '22%',
    height: 10,
    borderRadius: 5,
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 0,
  },
  tripBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  metaWide: {
    width: '88%',
    height: 12,
    borderRadius: 6,
  },
  metaMid: {
    width: '62%',
    height: 12,
    borderRadius: 6,
  },
  upNext: {
    marginTop: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  upNextFill: {
    flex: 1,
    height: 12,
    borderRadius: 6,
  },
  upNextDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    width: 64,
    height: 28,
    borderRadius: 999,
  },
  chipShort: {
    width: 48,
    height: 28,
    borderRadius: 999,
  },
  cta: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    marginTop: 4,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  actionTilePrimary: {
    backgroundColor: '#E8E6E1',
    borderColor: '#E8E6E1',
  },
  actionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  actionLabel: {
    width: '58%',
    height: 10,
    borderRadius: 5,
  },
  paymentsBlock: {
    gap: 8,
  },
  paymentsEyebrow: {
    width: '48%',
    height: 10,
    borderRadius: 5,
  },
  paymentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  paymentsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  paymentsCopy: {
    flex: 1,
    gap: 8,
  },
  paymentsLineWide: {
    width: '78%',
    height: 11,
    borderRadius: 5,
  },
  paymentsLineShort: {
    width: '46%',
    height: 10,
    borderRadius: 5,
  },
  paymentsTrailing: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});
