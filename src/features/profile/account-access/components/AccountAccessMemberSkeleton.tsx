/**
 * Account access loading — mirrors the white member card.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

export function AccountAccessMemberSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading account access">
      <View style={styles.row}>
        <View style={styles.topLine}>
          <View style={styles.identityCol}>
            <SkeletonBone style={styles.nameBone} />
            <SkeletonBone style={styles.emailBone} />
          </View>
          <SkeletonBone style={styles.badgeBone} />
        </View>
        <SkeletonBone style={styles.summaryBone} />
        <SkeletonBone style={styles.summaryBoneShort} />
        <View style={styles.actions}>
          <SkeletonBone style={styles.actionBone} />
          <SkeletonBone style={styles.actionBone} />
        </View>
      </View>
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 12,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityCol: {
    flex: 1,
    gap: 8,
  },
  nameBone: {
    width: '58%',
    height: 16,
    borderRadius: 6,
  },
  emailBone: {
    width: '72%',
    height: 12,
    borderRadius: 5,
  },
  badgeBone: {
    width: 72,
    height: 24,
    borderRadius: 999,
  },
  summaryBone: {
    width: '94%',
    height: 12,
    borderRadius: 5,
  },
  summaryBoneShort: {
    width: '68%',
    height: 12,
    borderRadius: 5,
    marginTop: -4,
  },
  actions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 4,
  },
  actionBone: {
    width: 96,
    height: 12,
    borderRadius: 5,
  },
});
