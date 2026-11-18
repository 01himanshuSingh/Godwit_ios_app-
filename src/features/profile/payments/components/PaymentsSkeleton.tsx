/**
 * Payments screen loading skeleton — forest hero + tabs + list card bones.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

type PaymentsSkeletonProps = {
  /** When true, only the tab list card (hero already on screen). */
  tabOnly?: boolean;
};

function ListCardBones({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listHeader}>
        <SkeletonBone style={styles.sectionLabel} />
        <SkeletonBone style={styles.headerMeta} />
      </View>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index}>
          {index > 0 ? <View style={styles.rowDivider} /> : null}
          <View style={styles.row}>
            <SkeletonBone style={styles.icon} />
            <View style={styles.rowCopy}>
              <SkeletonBone style={styles.rowTitle} />
              <SkeletonBone style={styles.rowMeta} />
            </View>
            <View style={styles.rowTrailing}>
              <SkeletonBone style={styles.rowAmount} />
              <SkeletonBone style={styles.rowBadge} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PaymentsSkeleton({ tabOnly = false }: PaymentsSkeletonProps) {
  if (tabOnly) {
    return (
      <View style={styles.tabOnly} accessibilityLabel="Loading payments tab">
        <ListCardBones />
      </View>
    );
  }

  return (
    <View style={styles.stack} accessibilityLabel="Loading payments">
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <SkeletonBone style={styles.heroLabel} />
          <SkeletonBone style={styles.heroBadge} />
        </View>
        <SkeletonBone style={styles.heroAmount} />
        <SkeletonBone style={styles.heroBody} />
        <View style={styles.heroDivider} />
        <SkeletonBone style={styles.heroFooter} />
      </View>

      <View style={styles.tabs}>
        <SkeletonBone style={styles.tab} />
        <SkeletonBone style={styles.tab} />
        <SkeletonBone style={styles.tab} />
        <SkeletonBone style={styles.tabShort} />
      </View>
      <View style={styles.tabsLine} />

      <ListCardBones />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: 18,
  },
  tabOnly: {
    width: '100%',
  },
  hero: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.forest,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLabel: {
    width: 140,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(247, 246, 244, 0.18)',
  },
  heroBadge: {
    width: 48,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(216, 205, 184, 0.35)',
  },
  heroAmount: {
    width: '58%',
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(247, 246, 244, 0.22)',
  },
  heroBody: {
    width: '78%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(247, 246, 244, 0.14)',
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(247, 246, 244, 0.18)',
    marginTop: 4,
  },
  heroFooter: {
    width: '55%',
    height: 11,
    borderRadius: 6,
    backgroundColor: 'rgba(247, 246, 244, 0.14)',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 2,
  },
  tab: {
    width: 64,
    height: 12,
    borderRadius: 6,
  },
  tabShort: {
    width: 52,
    height: 12,
    borderRadius: 6,
  },
  tabsLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: -10,
  },
  listCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingTop: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  sectionLabel: {
    width: 110,
    height: 10,
    borderRadius: 5,
  },
  headerMeta: {
    width: 88,
    height: 10,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowCopy: {
    flex: 1,
    gap: 8,
  },
  rowTitle: {
    width: '70%',
    height: 12,
    borderRadius: 6,
  },
  rowMeta: {
    width: '55%',
    height: 10,
    borderRadius: 5,
  },
  rowTrailing: {
    alignItems: 'flex-end',
    gap: 8,
  },
  rowAmount: {
    width: 72,
    height: 12,
    borderRadius: 6,
  },
  rowBadge: {
    width: 58,
    height: 18,
    borderRadius: 999,
  },
  rowDivider: {
    marginLeft: 66,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
