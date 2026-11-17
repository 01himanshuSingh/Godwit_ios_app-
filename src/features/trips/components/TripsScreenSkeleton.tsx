/**
 * Trips list loading skeleton — day header + itinerary row cards.
 */
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

type TripsScreenSkeletonProps = {
  /** Number of day groups to mirror. */
  dayCount?: number;
};

function ItineraryRowSkeleton({ showDivider }: { showDivider: boolean }) {
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.typeRow}>
        <View style={styles.typeLeading}>
          <SkeletonBone style={styles.iconWell} />
          <SkeletonBone style={styles.typeLabel} />
        </View>
        <SkeletonBone style={styles.badge} />
      </View>
      <SkeletonBone style={styles.title} />
      <SkeletonBone style={styles.detail} />
    </View>
  );
}

function DayGroupSkeleton({ rows }: { rows: number }) {
  return (
    <View style={styles.dayWrap}>
      <SkeletonBone style={styles.dateHeader} />
      <View style={styles.card}>
        {Array.from({ length: rows }, (_, index) => (
          <ItineraryRowSkeleton key={index} showDivider={index < rows - 1} />
        ))}
      </View>
    </View>
  );
}

export function TripsScreenSkeleton({ dayCount = 2 }: TripsScreenSkeletonProps) {
  const { width } = useWindowDimensions();
  const pagePad = useMemo(() => (width < 360 ? 16 : width >= 768 ? 32 : 20), [width]);

  return (
    <View style={[styles.root, { paddingHorizontal: pagePad }]} accessibilityLabel="Loading trips">
      <DayGroupSkeleton rows={2} />
      {dayCount > 1 ? <DayGroupSkeleton rows={1} /> : null}
      {dayCount > 2 ? <DayGroupSkeleton rows={2} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 4,
  },
  dayWrap: {
    marginBottom: 18,
  },
  dateHeader: {
    width: '36%',
    height: 10,
    borderRadius: 5,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  iconWell: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  typeLabel: {
    width: 72,
    height: 10,
    borderRadius: 5,
  },
  badge: {
    width: 64,
    height: 22,
    borderRadius: 999,
  },
  title: {
    width: '78%',
    height: 16,
    borderRadius: 6,
  },
  detail: {
    width: '58%',
    height: 11,
    borderRadius: 5,
  },
});
