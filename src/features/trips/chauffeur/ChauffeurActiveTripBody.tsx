/**
 * Chauffeur Active Trip detail body — DETAILS card.
 * Rows: VEHICLE / ROUTE / TRAVELLERS
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
import { extractChauffeurSaleDetails } from '@/lib/firebase/sales/chauffeurServices';

const CHAUFFEUR_DETAIL_ROW_ORDER = ['VEHICLE', 'ROUTE', 'TRAVELLERS'] as const;

type ChauffeurActiveTripBodyProps = {
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

export function ChauffeurActiveTripBody({ detail, layout }: ChauffeurActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

  const { detailRows, subtitle } = useMemo(() => {
    const extracted = extractChauffeurSaleDetails(detail.raw ?? {});

    let rows = [...(detail.detailRows ?? [])];
    rows = upsertRow(rows, 'VEHICLE', extracted.vehicle);
    rows = upsertRow(rows, 'ROUTE', extracted.route);
    rows = upsertRow(rows, 'TRAVELLERS', extracted.travellers);
    // Drop legacy pick-up / drop-off / on-the-day if present on older mapped payloads.
    rows = rows.filter(
      (r) => r.label !== 'PICK-UP' && r.label !== 'DROP-OFF' && r.label !== 'ON THE DAY',
    );

    const sorted = rows.sort((a, b) => {
      const ai = CHAUFFEUR_DETAIL_ROW_ORDER.indexOf(
        a.label as (typeof CHAUFFEUR_DETAIL_ROW_ORDER)[number],
      );
      const bi = CHAUFFEUR_DETAIL_ROW_ORDER.indexOf(
        b.label as (typeof CHAUFFEUR_DETAIL_ROW_ORDER)[number],
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
