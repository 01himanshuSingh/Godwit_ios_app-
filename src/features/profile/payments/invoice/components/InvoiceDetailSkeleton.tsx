/**
 * Invoice detail loading skeleton — white card + action bones.
 */
import { StyleSheet, View } from 'react-native';

import { SkeletonBone } from '@/features/home/components/SkeletonBone';
import { colors } from '@/ui/tokens/colors';

export function InvoiceDetailSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading invoice">
      <View style={styles.card}>
        <SkeletonBone style={styles.brand} />
        <SkeletonBone style={styles.tagline} />
        <View style={styles.rule} />
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={styles.field}>
            <SkeletonBone style={styles.fieldLabel} />
            <SkeletonBone style={styles.fieldValue} />
          </View>
        ))}
        <View style={styles.rule} />
        <View style={styles.lineHeader}>
          <SkeletonBone style={styles.col} />
          <SkeletonBone style={styles.colShort} />
        </View>
        <View style={styles.lineRow}>
          <SkeletonBone style={styles.lineDesc} />
          <SkeletonBone style={styles.lineAmount} />
        </View>
      </View>
      <SkeletonBone style={styles.primaryBtn} />
      <View style={styles.secondaryRow}>
        <SkeletonBone style={styles.secondaryBtn} />
        <SkeletonBone style={styles.secondaryBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 18,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 14,
  },
  brand: {
    width: 120,
    height: 12,
    borderRadius: 4,
  },
  tagline: {
    width: 148,
    height: 8,
    borderRadius: 4,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    width: 88,
    height: 8,
    borderRadius: 4,
  },
  fieldValue: {
    width: '72%',
    height: 12,
    borderRadius: 4,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: 96,
    height: 8,
    borderRadius: 4,
  },
  colShort: {
    width: 56,
    height: 8,
    borderRadius: 4,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineDesc: {
    flex: 1,
    height: 12,
    borderRadius: 4,
  },
  lineAmount: {
    width: 72,
    height: 12,
    borderRadius: 4,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
  },
});
