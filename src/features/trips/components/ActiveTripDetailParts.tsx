/**
 * Shared Active Trip UI pieces (chips + DETAILS rows).
 * Service folders compose their own body around these.
 */
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export type DetailChip = {
  key: string;
  label: string;
  variant: 'filled' | 'plain';
};

export type ActiveTripBodyLayout = {
  titleSize: number;
  titleLineHeight: number;
  subtitleSize: number;
  detailValueSize: number;
};

export function buildDetailChips(detail: ActiveTripDetailBase): DetailChip[] {
  const isHotel = detail.serviceType === 'hotel' || detail.serviceType === 'hotelRoomExtension';
  const chips: DetailChip[] = [{ key: 'type', label: detail.serviceTypeLabel, variant: 'filled' }];
  if (detail.statusLabel) {
    chips.push({
      key: 'status',
      label: detail.statusLabel,
      variant: isHotel || detail.statusLabel !== 'Confirmed' ? 'filled' : 'plain',
    });
  }
  if (detail.confirmationBadge) {
    chips.push({
      key: 'conf',
      label: detail.confirmationBadge,
      variant: 'filled',
    });
  }
  if (detail.inclusionBadge) {
    chips.push({ key: 'inclusion', label: detail.inclusionBadge, variant: 'filled' });
  }
  if (detail.paymentLabel) {
    chips.push({ key: 'pay', label: detail.paymentLabel, variant: 'filled' });
  }
  return chips;
}

export function ActiveTripTitleBlock({
  title,
  subtitle,
  titleSize,
  titleLineHeight,
  subtitleSize,
  subtitleStyle,
}: {
  title: string;
  subtitle: string | null;
  titleSize: number;
  titleLineHeight: number;
  subtitleSize: number;
  subtitleStyle?: object;
}) {
  return (
    <>
      <Text
        style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[styles.subtitle, subtitleStyle, { fontSize: subtitleSize }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      ) : null}
    </>
  );
}

export function ActiveTripChipRow({ chips }: { chips: DetailChip[] }) {
  return (
    <View style={styles.chipRow}>
      {chips.map((chip) =>
        chip.variant === 'plain' ? (
          <Text key={chip.key} style={styles.chipPlain}>
            {chip.label}
          </Text>
        ) : (
          <View key={chip.key} style={styles.chip}>
            <Text
              style={styles.chipLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {chip.label}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

export function ActiveTripDetailsCard({
  rows,
  detailValueSize,
  tone = 'default',
}: {
  rows: DetailRow[];
  detailValueSize: number;
  /** Soft sand card — hotel / air mocks */
  tone?: 'default' | 'soft' | 'hotel';
}) {
  if (!rows.length) {
    return null;
  }
  const soft = tone === 'soft' || tone === 'hotel';
  return (
    <View style={[styles.detailsCard, soft && styles.detailsCardSoft]}>
      <Text style={styles.detailsHeading}>DETAILS</Text>
      {rows.map((row) => (
        <View key={`${row.label}-${row.value}`} style={styles.detailBlock}>
          <Text style={styles.detailLabel}>{row.label}</Text>
          {row.kind === 'phone' ? (
            <View style={styles.phoneRow}>
              <Feather name="phone" size={15} color={colors.forest} />
              <Text
                style={[styles.detailValue, styles.phoneValue, { fontSize: detailValueSize }]}
                selectable
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {row.value}
              </Text>
            </View>
          ) : (
            <Text style={[styles.detailValue, { fontSize: detailValueSize }]} selectable>
              {row.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fontFamily.cormorant.regular,
    color: colors.forest,
    marginTop: 4,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: fontFamily.manrope.regular,
    lineHeight: 22,
    color: colors.muted,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 22,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  chipLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 12,
    color: colors.muted,
  },
  chipPlain: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 13,
    color: colors.muted,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    width: '100%',
  },
  detailsCardSoft: {
    backgroundColor: '#F8F7F5',
  },
  detailsHeading: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 18,
    textTransform: 'uppercase',
  },
  detailBlock: {
    marginBottom: 18,
    gap: 5,
  },
  detailLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: fontFamily.manrope.regular,
    lineHeight: 22,
    color: colors.forest,
    flexShrink: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  phoneValue: {
    flex: 1,
    minWidth: 0,
  },
});
