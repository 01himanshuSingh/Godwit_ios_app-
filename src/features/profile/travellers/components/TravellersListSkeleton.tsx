/**
 * Travellers list loading skeleton — mirrors white card + avatar rows.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

type TravellersListSkeletonProps = {
  rows?: number;
};

function TravellerRowSkeleton({ showDivider }: { showDivider: boolean }) {
  return (
    <View>
      <View style={styles.row}>
        <SkeletonBone style={styles.avatar} />
        <View style={styles.copy}>
          <SkeletonBone style={styles.name} />
          <SkeletonBone style={styles.meta} />
        </View>
        <SkeletonBone style={styles.chevron} />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function TravellersListSkeleton({ rows = 3 }: TravellersListSkeletonProps) {
  return (
    <View style={styles.card} accessibilityLabel="Loading travellers">
      {Array.from({ length: rows }, (_, index) => (
        <TravellerRowSkeleton key={index} showDivider={index < rows - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  name: {
    width: '55%',
    height: 14,
    borderRadius: 7,
  },
  meta: {
    width: '40%',
    height: 10,
    borderRadius: 5,
  },
  chevron: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  divider: {
    marginLeft: 78,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
