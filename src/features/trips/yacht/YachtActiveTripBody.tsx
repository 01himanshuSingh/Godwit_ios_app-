/**
 * Yacht Active Trip detail body — mock DETAILS card.
 * Data from getActiveTripDetail → mapYachtDetail (one sale getDoc).
 *
 *   Title     ← walkIn.route + destinationCity
 *   Subtitle  ← walkIn.category
 *   INCLUDED  ← walkIn.yachtDescription
 *   Rows      ← BEGINS / ENDS / INCLUDED / TRAVELLERS
 */
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ActiveTripChipRow,
  ActiveTripDetailsCard,
  ActiveTripTitleBlock,
  buildDetailChips,
  type ActiveTripBodyLayout,
} from '@/features/trips/components/ActiveTripDetailParts';
import { CancellationTermsCard } from '@/features/trips/components/CancellationTermsCard';
import { MessageGodwitCard } from '@/features/trips/components/MessageGodwitCard';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';

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

export function YachtActiveTripBody({ detail, layout }: YachtActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

  const walkIn = detail.raw?.walkInModel as Record<string, unknown> | undefined;

  // Subtitle ← walkInModel.category only (reject if it looks like yachtDescription)
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

    // INCLUDED ← walkInModel.yachtDescription (DB) — force onto DETAILS card
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

  return (
    <View style={styles.root}>
      <ActiveTripTitleBlock
        title={detail.title}
        subtitle={subtitle}
        titleSize={layout.titleSize}
        titleLineHeight={layout.titleLineHeight}
        subtitleSize={layout.subtitleSize}
        subtitleStyle={styles.yachtSubtitle}
      />

      <ActiveTripChipRow chips={chips} />

      <ActiveTripDetailsCard
        rows={detailRows}
        detailValueSize={layout.detailValueSize}
        tone="soft"
      />

      <CancellationTermsCard terms={detail.cancellationTerms} />
      {detail.showMessageGodwitCta ? <MessageGodwitCard /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  yachtSubtitle: {
    marginTop: 4,
    marginBottom: 2,
  },
});
