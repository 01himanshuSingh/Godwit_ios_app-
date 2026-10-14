/**
 * Airport VIP Meet Active Trip detail body — DETAILS mock card.
 * Rows: AIRPORT / SERVICE / TIME / INCLUDED / TRAVELLERS
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
import { extractVipSaleDetails } from '@/lib/firebase/sales/vipServices';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';

const VIP_DETAIL_ROW_ORDER = ['AIRPORT', 'SERVICE', 'TIME', 'INCLUDED', 'TRAVELLERS'] as const;

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

export function VipActiveTripBody({ detail, layout }: VipActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

  const { detailRows, subtitle } = useMemo(() => {
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

    return {
      detailRows: sorted,
      subtitle: detail.subtitle ?? extracted.service,
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
        subtitleStyle={styles.vipSubtitle}
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
  vipSubtitle: {
    marginTop: 4,
    marginBottom: 2,
  },
});
