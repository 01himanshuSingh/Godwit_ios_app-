/**
 * Private jet Active Trip detail body — DETAILS card.
 * Rows: CARRIER / AIRCRAFT / ROUTE / TRAVELLERS
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
import { extractPrivateJetSaleDetails } from '@/lib/firebase/sales/privateJetServices';

const PRIVATE_JET_DETAIL_ROW_ORDER = ['CARRIER', 'AIRCRAFT', 'ROUTE', 'TRAVELLERS'] as const;

type PrivateJetActiveTripBodyProps = {
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

export function PrivateJetActiveTripBody({ detail, layout }: PrivateJetActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

  const { detailRows, subtitle } = useMemo(() => {
    const extracted = extractPrivateJetSaleDetails(detail.raw ?? {});

    let rows = [...(detail.detailRows ?? [])];
    rows = upsertRow(rows, 'CARRIER', extracted.carrier);
    rows = upsertRow(rows, 'AIRCRAFT', extracted.aircraft);
    rows = upsertRow(rows, 'ROUTE', extracted.route);
    rows = upsertRow(rows, 'TRAVELLERS', extracted.travellers);
    // Drop air-style DEPARTS / ARRIVES if present on older mapped payloads.
    rows = rows.filter((r) => r.label !== 'DEPARTS' && r.label !== 'ARRIVES');

    const sorted = rows.sort((a, b) => {
      const ai = PRIVATE_JET_DETAIL_ROW_ORDER.indexOf(
        a.label as (typeof PRIVATE_JET_DETAIL_ROW_ORDER)[number],
      );
      const bi = PRIVATE_JET_DETAIL_ROW_ORDER.indexOf(
        b.label as (typeof PRIVATE_JET_DETAIL_ROW_ORDER)[number],
      );
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });

    return {
      detailRows: sorted,
      subtitle: detail.subtitle ?? extracted.route,
    };
  }, [detail.detailRows, detail.raw, detail.subtitle]);

  return (
    <View style={styles.root}>
      <ActiveTripTitleBlock
        title={detail.title}
        subtitle={subtitle}
        titleSize={layout.titleSize}
        titleLineHeight={layout.titleLineHeight}
        subtitleSize={layout.subtitleSize}
        subtitleStyle={styles.subtitle}
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
  subtitle: {
    marginTop: 4,
    marginBottom: 2,
  },
});
