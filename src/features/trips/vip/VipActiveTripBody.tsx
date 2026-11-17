/**
 * Airport VIP Active Trip detail body — dark hero, summary strip, DETAILS.
 * Same extractVipSaleDetails / detail fields as before; UI only.
 * Visual styles on View; Pressable is a plain touch wrapper where needed.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActiveTripBodyLayout } from '@/features/trips/components/ActiveTripDetailParts';
import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { CancellationTermsCard } from '@/features/trips/components/CancellationTermsCard';
import { MessageGodwitCard } from '@/features/trips/components/MessageGodwitCard';
import { extractVipSaleDetails } from '@/lib/firebase/sales/vipServices';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';
import { colors } from '@/ui/tokens/colors';

const VIP_DETAIL_ROW_ORDER = ['AIRPORT', 'SERVICE', 'TIME', 'INCLUDED', 'TRAVELLERS'] as const;

const DETAIL_VALUE_MEDIUM = new Set(['AIRPORT', 'SERVICE', 'TIME', 'TRAVELLERS']);

type VipActiveTripBodyProps = {
  detail: ActiveTripDetailBase;
  layout: ActiveTripBodyLayout;
};

function upsertRow(rows: DetailRow[], label: string, value: string | null): DetailRow[] {
  const next = rows.filter((r) => r.label !== label);
  const v = value?.trim();
  if (v) {
    next.push({ label, value: v, kind: 'text' });
  }
  return next;
}

function rowValue(rows: DetailRow[], label: string): string | null {
  const hit = rows.find((r) => r.label === label);
  const v = hit?.value?.trim();
  return v || null;
}

export function VipActiveTripBody({ detail, layout: _layout }: VipActiveTripBodyProps) {
  const { detailRows, subtitle, summary } = useMemo(() => {
    const extracted = extractVipSaleDetails(detail.raw ?? {});

    let rows = [...(detail.detailRows ?? [])];
    rows = upsertRow(rows, 'AIRPORT', extracted.airport);
    rows = upsertRow(rows, 'SERVICE', extracted.service);
    rows = upsertRow(rows, 'TIME', extracted.time);
    rows = upsertRow(rows, 'INCLUDED', extracted.included);
    rows = upsertRow(rows, 'TRAVELLERS', extracted.travellers);

    const sorted = rows.sort((a, b) => {
      const ai = VIP_DETAIL_ROW_ORDER.indexOf(a.label as (typeof VIP_DETAIL_ROW_ORDER)[number]);
      const bi = VIP_DETAIL_ROW_ORDER.indexOf(b.label as (typeof VIP_DETAIL_ROW_ORDER)[number]);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });

    const airport = rowValue(sorted, 'AIRPORT');
    const time = rowValue(sorted, 'TIME');
    const service = rowValue(sorted, 'SERVICE');

    const summaryCards = [
      airport ? { key: 'airport', label: 'AIRPORT', value: airport } : null,
      time ? { key: 'time', label: 'TIME', value: time } : null,
      service ? { key: 'service', label: 'SERVICE', value: service } : null,
    ].filter(Boolean) as { key: string; label: string; value: string }[];

    return {
      detailRows: sorted,
      subtitle: detail.subtitle ?? extracted.service,
      summary: summaryCards,
    };
  }, [detail.detailRows, detail.raw, detail.subtitle]);

  const statusChips = useMemo(() => {
    const chips: {
      key: string;
      label: string;
      variant: 'sand' | 'outline';
      weight: 'semibold' | 'medium';
    }[] = [];
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
  }, [detail.statusLabel, detail.confirmationBadge, detail.inclusionBadge, detail.paymentLabel]);

  const typeLabel = (detail.serviceTypeLabel || 'Airport VIP').toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeLabel} numberOfLines={1}>
              {typeLabel}
            </Text>
          </View>
          <Ionicons name="star-outline" size={18} color="rgba(255,255,255,0.85)" />
        </View>

        <Text style={styles.heroTitle} accessibilityRole="header">
          {detail.title}
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
            return (
              <View
                key={`${row.label}-${row.value}`}
                style={[styles.detailBlock, !isLast && styles.detailDivider]}
              >
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    DETAIL_VALUE_MEDIUM.has(row.label)
                      ? styles.detailValueMedium
                      : styles.detailValueRegular,
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

      <CancellationTermsCard terms={detail.cancellationTerms} />
      {detail.showMessageGodwitCta ? <MessageGodwitCard /> : null}
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
