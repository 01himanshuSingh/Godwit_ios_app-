/**
 * Traveller detail loading skeleton — mirrors hero + tabs + prefs card.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

export function TravellerDetailSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading traveller">
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <SkeletonBone style={styles.avatar} />
          <View style={styles.heroCopy}>
            <SkeletonBone style={styles.heroName} />
            <SkeletonBone style={styles.heroMeta} />
          </View>
        </View>
        <SkeletonBone style={styles.privacy} />
      </View>

      <View style={styles.tabs}>
        <SkeletonBone style={styles.tab} />
        <SkeletonBone style={styles.tab} />
        <SkeletonBone style={styles.tab} />
        <SkeletonBone style={styles.tabShort} />
        <SkeletonBone style={styles.tabShort} />
      </View>
      <View style={styles.tabsLine} />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SkeletonBone style={styles.sectionLabel} />
          <SkeletonBone style={styles.badge} />
        </View>
        <SkeletonBone style={styles.summary} />
        <View style={styles.cardDivider} />
        <View style={styles.field}>
          <SkeletonBone style={styles.fieldLabel} />
          <SkeletonBone style={styles.fieldValue} />
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.field}>
          <SkeletonBone style={styles.fieldLabel} />
          <SkeletonBone style={styles.fieldValueWide} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: 16,
  },
  hero: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.forest,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(216, 205, 184, 0.35)',
  },
  heroCopy: {
    flex: 1,
    gap: 10,
  },
  heroName: {
    width: '62%',
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(247, 246, 244, 0.22)',
  },
  heroMeta: {
    width: '38%',
    height: 11,
    borderRadius: 6,
    backgroundColor: 'rgba(247, 246, 244, 0.16)',
  },
  privacy: {
    width: '48%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(247, 246, 244, 0.14)',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 2,
  },
  tab: {
    width: 58,
    height: 12,
    borderRadius: 6,
  },
  tabShort: {
    width: 42,
    height: 12,
    borderRadius: 6,
  },
  tabsLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: -10,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionLabel: {
    width: 72,
    height: 10,
    borderRadius: 5,
  },
  badge: {
    width: 88,
    height: 22,
    borderRadius: 999,
  },
  summary: {
    width: '70%',
    height: 11,
    borderRadius: 6,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  field: {
    gap: 10,
    paddingVertical: 4,
  },
  fieldLabel: {
    width: '42%',
    height: 10,
    borderRadius: 5,
  },
  fieldValue: {
    width: '78%',
    height: 14,
    borderRadius: 7,
  },
  fieldValueWide: {
    width: '88%',
    height: 14,
    borderRadius: 7,
  },
});
