/**
 * Hotel Active Trip detail body — dark hero, check-in strip, DETAILS card.
 * Same backend detail model; only renders fields already mapped on `detail`.
 */
import Feather from '@expo/vector-icons/Feather';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActiveTripBodyLayout } from '@/features/trips/components/ActiveTripDetailParts';
import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { CancellationTermsCard } from '@/features/trips/components/CancellationTermsCard';
import { MessageGodwitCard } from '@/features/trips/components/MessageGodwitCard';
import { TripDocumentsCard } from '@/features/trips/components/TripDocumentsCard';
import {
  GodwitBenefitsCard,
  SpecialRequestsCard,
} from '@/features/trips/hotel/HotelActiveTripSections';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';
import { colors } from '@/ui/tokens/colors';

const HOTEL_DETAIL_ROW_ORDER = [
  'ROOM',
  'CHECK-IN',
  'CHECK-OUT',
  'NIGHTS',
  'MEAL PLAN',
  'ADDRESS',
  'TELEPHONE',
  'TRAVELLERS',
] as const;

/** Spec: ROOM / stay dates / TELEPHONE = Medium; longer prose fields = Regular. */
const DETAIL_VALUE_MEDIUM = new Set(['ROOM', 'CHECK-IN', 'CHECK-OUT', 'NIGHTS', 'TELEPHONE']);

type HotelActiveTripBodyProps = {
  detail: ActiveTripDetailBase;
  layout: ActiveTripBodyLayout;
};

function rowValue(rows: DetailRow[], label: string): string | null {
  const hit = rows.find((r) => r.label === label);
  const v = hit?.value?.trim();
  return v || null;
}

/** "12 February 2026, 15:00" / ISO → "Thu, 12 Feb" */
function formatSummaryDate(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  const long = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  let d: Date | null = null;

  if (iso) {
    d = new Date(`${iso[1]}T12:00:00`);
  } else if (long) {
    d = new Date(`${long[1]} ${long[2]} ${long[3]}`);
  } else {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      d = new Date(parsed);
    }
  }

  if (!d || Number.isNaN(d.getTime())) {
    return raw.split(',')[0]?.trim() || raw;
  }

  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

function formatNightsSummary(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const t = raw.trim();
  if (/nights?/i.test(t)) {
    return t.replace(/^(\d+)\s*nights?$/i, (_, n) => `${n} Nights`);
  }
  if (/^\d+$/.test(t)) {
    return `${t} Nights`;
  }
  return t;
}

export function HotelActiveTripBody({ detail, layout: _layout }: HotelActiveTripBodyProps) {
  const detailRows = useMemo(() => {
    const rows = detail.detailRows ?? [];
    if (rows.length < 2) {
      return rows;
    }
    return [...rows].sort((a, b) => {
      const ai = HOTEL_DETAIL_ROW_ORDER.indexOf(a.label as (typeof HOTEL_DETAIL_ROW_ORDER)[number]);
      const bi = HOTEL_DETAIL_ROW_ORDER.indexOf(b.label as (typeof HOTEL_DETAIL_ROW_ORDER)[number]);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }, [detail.detailRows]);

  const summary = useMemo(() => {
    const checkIn = formatSummaryDate(rowValue(detailRows, 'CHECK-IN'));
    const checkOut = formatSummaryDate(rowValue(detailRows, 'CHECK-OUT'));
    const nights = formatNightsSummary(rowValue(detailRows, 'NIGHTS'));
    return [
      checkIn ? { key: 'check-in', label: 'CHECK-IN', value: checkIn } : null,
      checkOut ? { key: 'check-out', label: 'CHECK-OUT', value: checkOut } : null,
      nights ? { key: 'nights', label: 'NIGHTS', value: nights } : null,
    ].filter(Boolean) as { key: string; label: string; value: string }[];
  }, [detailRows]);

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
    if (detail.paymentLabel?.trim()) {
      chips.push({
        key: 'pay',
        label: detail.paymentLabel.trim(),
        variant: 'sand',
        weight: 'semibold',
      });
    }
    return chips;
  }, [detail.statusLabel, detail.confirmationBadge, detail.paymentLabel]);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeLabel} numberOfLines={1}>
            {detail.serviceTypeLabel?.toUpperCase() || 'HOTEL'}
          </Text>
        </View>

        <Text style={styles.heroTitle} accessibilityRole="header">
          {detail.title}
        </Text>

        {detail.subtitle ? (
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {detail.subtitle}
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
            const isPhone = row.kind === 'phone' || row.label === 'TELEPHONE';
            return (
              <View
                key={`${row.label}-${row.value}`}
                style={[styles.detailBlock, !isLast && styles.detailDivider]}
              >
                <Text style={styles.detailLabel}>{row.label}</Text>
                {isPhone ? (
                  <View style={styles.phoneRow}>
                    <Text
                      style={[styles.detailValue, styles.detailValueMedium, styles.phoneValue]}
                      selectable
                      numberOfLines={2}
                    >
                      {row.value}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${row.value}`}
                      onPress={() => {
                        const digits = row.value.replace(/[^\d+]/g, '');
                        if (digits) {
                          void Linking.openURL(`tel:${digits}`);
                        }
                      }}
                      style={({ pressed }) => [styles.phoneBtn, pressed && styles.pressed]}
                    >
                      <Feather name="phone" size={16} color={colors.forest} />
                    </Pressable>
                  </View>
                ) : (
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
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Backend-mapped optional cards — hide themselves when empty */}
      <SpecialRequestsCard lines={detail.specialRequests} />
      <CancellationTermsCard terms={detail.cancellationTerms} />
      <GodwitBenefitsCard benefits={detail.godwitBenefits} />
      {detail.showMessageGodwitCta ? <MessageGodwitCard /> : null}
      <TripDocumentsCard
        voucherUrl={detail.voucherUrl}
        fileLabel={detail.title ? `${detail.title} Booking` : 'Hotel Booking'}
        hideWhenEmpty
      />
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  phoneValue: {
    flex: 1,
    minWidth: 0,
  },
  phoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
});
