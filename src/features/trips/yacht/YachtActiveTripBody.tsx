/**
 * Yacht Active Trip detail body — dark hero, BEGINS/ENDS strip, DETAILS.
 * Same backend fields as before (mapYachtDetail + walkIn filters); UI only.
 * Visual styles on View; Pressable is a plain touch wrapper where needed.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActiveTripBodyLayout } from '@/features/trips/components/ActiveTripDetailParts';
import { activeTripType } from '@/features/trips/components/activeTripDetailTypography';
import { CancellationTermsCard } from '@/features/trips/components/CancellationTermsCard';
import { MessageGodwitCard } from '@/features/trips/components/MessageGodwitCard';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';
import { colors } from '@/ui/tokens/colors';

const YACHT_DETAIL_ROW_ORDER = ['BEGINS', 'ENDS', 'INCLUDED', 'TRAVELLERS'] as const;

const YACHT_HIDDEN_LABELS = new Set([
  'LOCATION',
  'DESTINATION',
  'DATE',
  'TIME',
  'YACHT',
  'DESCRIPTION',
  'MEALS',
  'GUESTS',
  'BOOKING REF',
  'TICKET',
]);

const DETAIL_VALUE_MEDIUM = new Set(['BEGINS', 'ENDS', 'TRAVELLERS']);

type YachtActiveTripBodyProps = {
  detail: ActiveTripDetailBase;
  layout: ActiveTripBodyLayout;
};

function readWalkInString(walkIn: Record<string, unknown> | undefined, key: string): string | null {
  const v = walkIn?.[key];
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    return String(v);
  }
  return null;
}

function formatIncludedLine(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(/[\n;|]+|\s*[·•]\s*|\s*,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return parts.join(' · ');
}

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

/** "12 February 2026, 10:00" → "Thu, 12 Feb" (time kept when present as "12 Feb · 10:00"). */
function formatYachtSummaryDate(raw: string | null): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const time = raw.match(/\b(\d{1,2}:\d{2})\b/)?.[1] ?? null;
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
  const datePart = `${weekday}, ${day} ${month}`;
  return time ? `${datePart} · ${time}` : datePart;
}

function travellersSummary(raw: string | null): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const names = raw
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length <= 1) {
    return raw.trim();
  }
  return `${names.length} guests`;
}

export function YachtActiveTripBody({ detail, layout: _layout }: YachtActiveTripBodyProps) {
  const walkIn = detail.raw?.walkInModel as Record<string, unknown> | undefined;

  // Subtitle ← walkInModel.category only (same filter as previous UI)
  const subtitle = useMemo(() => {
    const category = readWalkInString(walkIn, 'category');
    const yachtDescription = readWalkInString(walkIn, 'yachtDescription');
    if (!category) return null;
    if (yachtDescription && category.toLowerCase() === yachtDescription.toLowerCase()) {
      return null;
    }
    if (
      category.includes('·') ||
      category.includes('•') ||
      category.length > 60 ||
      /\b(crew|lunch|tender|water toys|captain)\b/i.test(category)
    ) {
      return null;
    }
    return category;
  }, [walkIn]);

  const detailRows = useMemo(() => {
    let rows = (detail.detailRows ?? []).filter((r) => !YACHT_HIDDEN_LABELS.has(r.label));

    // INCLUDED ← walkInModel.yachtDescription (DB) — same as previous
    const included = formatIncludedLine(readWalkInString(walkIn, 'yachtDescription'));
    rows = upsertRow(rows, 'INCLUDED', included);

    if (rows.length < 2) {
      return rows;
    }
    return [...rows].sort((a, b) => {
      const ai = YACHT_DETAIL_ROW_ORDER.indexOf(a.label as (typeof YACHT_DETAIL_ROW_ORDER)[number]);
      const bi = YACHT_DETAIL_ROW_ORDER.indexOf(b.label as (typeof YACHT_DETAIL_ROW_ORDER)[number]);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }, [detail.detailRows, walkIn]);

  const summary = useMemo(() => {
    const begins = formatYachtSummaryDate(rowValue(detailRows, 'BEGINS'));
    const ends = formatYachtSummaryDate(rowValue(detailRows, 'ENDS'));
    const guests = travellersSummary(rowValue(detailRows, 'TRAVELLERS'));
    return [
      begins ? { key: 'begins', label: 'BEGINS', value: begins } : null,
      ends ? { key: 'ends', label: 'ENDS', value: ends } : null,
      guests ? { key: 'guests', label: 'GUESTS', value: guests } : null,
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

  const typeLabel = (detail.serviceTypeLabel || 'Yacht').toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeLabel} numberOfLines={1}>
              {typeLabel}
            </Text>
          </View>
          <Ionicons name="boat-outline" size={18} color="rgba(255,255,255,0.85)" />
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
