/**
 * Documents tab loading skeleton — section header + document row bones.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

export function DocumentsSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading documents">
      <View style={styles.sectionHeader}>
        <SkeletonBone style={styles.groupLabel} />
        <SkeletonBone style={styles.fileCount} />
      </View>
      <View style={styles.card}>
        {[0, 1].map((index) => (
          <View key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row}>
              <SkeletonBone style={styles.icon} />
              <View style={styles.copy}>
                <SkeletonBone style={styles.title} />
                <SkeletonBone style={styles.meta} />
              </View>
              <SkeletonBone style={styles.badge} />
            </View>
            <View style={styles.actions}>
              <SkeletonBone style={styles.action} />
              <SkeletonBone style={styles.action} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupLabel: {
    width: 72,
    height: 10,
    borderRadius: 4,
  },
  fileCount: {
    width: 48,
    height: 10,
    borderRadius: 4,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    width: '78%',
    height: 12,
    borderRadius: 4,
  },
  meta: {
    width: '55%',
    height: 10,
    borderRadius: 4,
  },
  badge: {
    width: 48,
    height: 22,
    borderRadius: 999,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 14,
  },
  action: {
    flex: 1,
    height: 40,
    borderRadius: 10,
  },
});
