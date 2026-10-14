/**
 * Air Active Trip detail body — flight DETAILS card.
 * DEPARTS / ARRIVES: route ends + travelDate / returnDate
 *   e.g. "DEL · 25 October 2026" / "BOM · 25 October 2026"
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
import { extractAirSaleFlightDetails } from '@/lib/firebase/sales/airServices';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';

const AIR_DETAIL_ROW_ORDER = [
  'CARRIER',
  'FLIGHT',
  'DEPARTS',
  'ARRIVES',
  'CABIN',
  'SEATS',
  'BAGGAGE',
  'TRAVELLERS',
] as const;

type AirActiveTripBodyProps = {
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

export function AirActiveTripBody({ detail, layout }: AirActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

  const { detailRows, subtitle } = useMemo(() => {
    // Card source of truth: route ends + travelDate / returnDate → DEPARTS / ARRIVES.
    const extracted = extractAirSaleFlightDetails(detail.raw ?? {});

    let rows = [...(detail.detailRows ?? [])];
    rows = upsertRow(rows, 'DEPARTS', extracted.departs);
    rows = upsertRow(rows, 'ARRIVES', extracted.arrives);

    if (extracted.carrier) {
      rows = upsertRow(rows, 'CARRIER', extracted.carrier);
    }
    // FLIGHT row = PNR (bookingRef), else flight number.
    rows = upsertRow(rows, 'FLIGHT', extracted.bookingRef ?? extracted.flightNumber);
    if (extracted.cabin) {
      rows = upsertRow(rows, 'CABIN', extracted.cabin);
    }
    if (extracted.seats) {
      rows = upsertRow(rows, 'SEATS', extracted.seats);
    }
    if (extracted.baggage) {
      rows = upsertRow(rows, 'BAGGAGE', extracted.baggage);
    }
    if (extracted.travellers) {
      rows = upsertRow(rows, 'TRAVELLERS', extracted.travellers);
    }

    const sorted = rows.sort((a, b) => {
      const ai = AIR_DETAIL_ROW_ORDER.indexOf(a.label as (typeof AIR_DETAIL_ROW_ORDER)[number]);
      const bi = AIR_DETAIL_ROW_ORDER.indexOf(b.label as (typeof AIR_DETAIL_ROW_ORDER)[number]);
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
        subtitleStyle={styles.airSubtitle}
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
  airSubtitle: {
    marginTop: 4,
    marginBottom: 2,
  },
});
