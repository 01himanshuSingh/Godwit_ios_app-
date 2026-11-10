/**
 * Adults / Children / Infants steppers — party composition for request forms.
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CountStepper } from '@/features/requests/components/CountStepper';
import { FieldErrorText } from '@/features/requests/components/FieldErrorText';
import type { TravellerCounts } from '@/features/requests/shared/travellerCounts';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type TravellerCountCardProps = {
  counts: TravellerCounts;
  onChange: (next: TravellerCounts) => void;
  error?: string | null;
};

type RowProps = {
  title: string;
  subtitle: string;
  value: number;
  onChange: (value: number) => void;
  showDivider?: boolean;
};

function CountRow({ title, subtitle, value, onChange, showDivider }: RowProps) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <CountStepper value={value} onChange={onChange} accessibilityLabel={title} />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function TravellerCountCardComponent({ counts, onChange, error }: TravellerCountCardProps) {
  return (
    <View style={[styles.card, error ? styles.cardError : null]}>
      <Text style={styles.label}>COUNT OF TRAVELERS</Text>
      <FieldErrorText message={error} />
      <CountRow
        title="Adults"
        subtitle="Ages 15 Above"
        value={counts.adults}
        onChange={(adults) => onChange({ ...counts, adults })}
        showDivider
      />
      <CountRow
        title="Children"
        subtitle="Ages 2 - 14"
        value={counts.children}
        onChange={(children) => onChange({ ...counts, children })}
        showDivider
      />
      <CountRow
        title="Infants"
        subtitle="Under 2"
        value={counts.infants}
        onChange={(infants) => onChange({ ...counts, infants })}
      />
    </View>
  );
}

export const TravellerCountCard = memo(TravellerCountCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    shadowColor: '#1B2915',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardError: {
    borderColor: '#B42318',
    borderWidth: 1,
  },
  label: {
    marginBottom: 8,
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.fieldLabel,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
