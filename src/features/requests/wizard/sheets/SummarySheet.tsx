import Feather from '@expo/vector-icons/Feather';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SheetModal } from '@/features/requests/wizard/sheets/SheetModal';
import type { WizardSummaryRow } from '@/features/requests/wizard/types';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type SummarySheetProps = {
  visible: boolean;
  rows: WizardSummaryRow[];
  completedCount: number;
  totalCount: number;
  onClose: () => void;
};

const ICON_MAP: Record<WizardSummaryRow['icon'], keyof typeof Feather.glyphMap> = {
  pin: 'map-pin',
  calendar: 'calendar',
  star: 'star',
  door: 'home',
  people: 'users',
  note: 'edit-3',
  plane: 'send',
  car: 'truck',
  boat: 'anchor',
};

export function SummarySheet({
  visible,
  rows,
  completedCount,
  totalCount,
  onClose,
}: SummarySheetProps) {
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Request Summary"
      rightAction={{ label: 'Close', onPress: onClose }}
      heightRatio={0.78}
    >
      <Text style={styles.progressLabel}>
        {completedCount} of {totalCount} sections complete
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <ScrollView style={styles.list}>
        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.iconCircle}>
              <Feather name={ICON_MAP[row.icon]} size={16} color={colors.forest} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={[styles.rowValue, !row.value && styles.rowEmpty]}>
                {row.value || '—'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  progressLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surface,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.forest,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  rowValue: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    color: colors.forest,
  },
  rowEmpty: {
    color: colors.muted,
    fontFamily: fontFamily.manrope.regular,
  },
});
