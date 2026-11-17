/**
 * Shared Active Trip premium chrome — dark hero, summary strip, DETAILS, lower cards.
 * Service bodies supply already-mapped rows/chips; no backend changes here.
 * Visual styles on View; Pressable remains a plain touch wrapper in child CTAs.
 */
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { CancellationTermsCard } from '@/features/trips/components/CancellationTermsCard';
import { MessageGodwitCard } from '@/features/trips/components/MessageGodwitCard';
import type { DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';
import { colors } from '@/ui/tokens/colors';

export type PremiumStatusChip = {
  key: string;
  label: string;
  variant: 'sand' | 'outline';
  weight: 'semibold' | 'medium';
};

export type PremiumSummaryCard = {
  key: string;
  label: string;
  value: string;
};

type ActiveTripPremiumShellProps = {
  typeLabel: string;
  iconName: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string | null;
  statusChips: PremiumStatusChip[];
  summary: PremiumSummaryCard[];
  detailRows: DetailRow[];
  detailValueMediumLabels?: Set<string>;
  cancellationTerms: string | null | undefined;
  showMessageGodwitCta: boolean;
};

export function buildPremiumStatusChips(detail: {
  statusLabel?: string | null;
  confirmationBadge?: string | null;
  inclusionBadge?: string | null;
  paymentLabel?: string | null;
}): PremiumStatusChip[] {
  const chips: PremiumStatusChip[] = [];
  if (detail.statusLabel?.trim()) {
    chips.push({
      key: 'status',
      label: detail.statusLabel.trim(),
      variant: 'sand',
      weight: 'semibold',
    });
  }
  if (detail.confirmationBadge?.trim()) {
    chips.push({
      key: 'conf',
      label: detail.confirmationBadge.trim(),
      variant: 'outline',
      weight: 'medium',
    });
  }
  if (detail.inclusionBadge?.trim()) {
    chips.push({
      key: 'inclusion',
      label: detail.inclusionBadge.trim(),
      variant: 'sand',
      weight: 'semibold',
    });
  }
  if (detail.paymentLabel?.trim()) {
    chips.push({
      key: 'pay',
      label: detail.paymentLabel.trim(),
      variant: 'sand',
      weight: 'semibold',
    });
  }
  return chips;
}

export function ActiveTripPremiumShell({
  typeLabel,
  iconName,
  title,
  subtitle,
  statusChips,
  summary,
  detailRows,
  detailValueMediumLabels,
  cancellationTerms,
  showMessageGodwitCta,
}: ActiveTripPremiumShellProps) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeLabel} numberOfLines={1}>
              {typeLabel.toUpperCase()}
            </Text>
          </View>
          <Ionicons name={iconName} size={18} color="rgba(255,255,255,0.85)" />
        </View>

        <Text style={styles.heroTitle} accessibilityRole="header">
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}

        {statusChips.length ? (
          <View style={styles.chipRow}>
            {statusChips.map((chip) => (
              <View
                key={chip.key}
                style={[
                  styles.chip,
                  chip.variant === 'outline' ? styles.chipOutline : styles.chipSand,
                ]}
              >
                <Text
                  style={[
                    chip.weight === 'semibold' ? styles.chipLabelSemibold : styles.chipLabelMedium,
                    chip.variant === 'outline' ? styles.chipLabelOutline : styles.chipLabelSand,
                    chip.variant === 'outline' && styles.chipLabelConfirm,
                  ]}
                  numberOfLines={1}
                >
                  {chip.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {summary.length ? (
        <View style={styles.summaryRow}>
          {summary.map((item) => (
            <View key={item.key} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {detailRows.length ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>DETAILS</Text>
          {detailRows.map((row, index) => {
            const isLast = index === detailRows.length - 1;
            const medium = detailValueMediumLabels?.has(row.label) ?? true;
            return (
              <View
                key={`${row.label}-${row.value}`}
                style={[styles.detailBlock, !isLast && styles.detailDivider]}
              >
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    medium ? styles.detailValueMedium : styles.detailValueRegular,
                  ]}
                  selectable
                >
                  {row.value}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <CancellationTermsCard terms={cancellationTerms} />
      {showMessageGodwitCta ? <MessageGodwitCard /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 14,
  },
  hero: {
    backgroundColor: colors.forest,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  typeBadgeLabel: {
    ...activeTripType.serviceBadge,
    color: '#FFFFFF',
  },
  heroTitle: {
    ...activeTripType.heroTitle,
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroSubtitle: {
    ...activeTripType.heroSubtitle,
    color: 'rgba(255,255,255,0.78)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  chipSand: {
    backgroundColor: colors.sand,
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  chipLabelSemibold: {
    ...activeTripType.chipSemibold,
  },
  chipLabelMedium: {
    ...activeTripType.chipMedium,
  },
  chipLabelConfirm: {
    fontSize: 11,
  },
  chipLabelSand: {
    color: colors.forest,
  },
  chipLabelOutline: {
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  summaryLabel: {
    ...activeTripType.summaryLabel,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  summaryValue: {
    ...activeTripType.summaryValue,
    color: colors.forest,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    width: '100%',
  },
  detailsHeading: {
    ...activeTripType.sectionHeading,
    color: colors.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailBlock: {
    paddingVertical: 11,
    gap: 5,
  },
  detailDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...activeTripType.detailLabel,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  detailValue: {
    ...activeTripType.detailValue,
    color: colors.forest,
    flexShrink: 1,
  },
  detailValueMedium: {
    ...activeTripType.detailValueMedium,
  },
  detailValueRegular: {
    ...activeTripType.detailValueRegular,
  },
});
