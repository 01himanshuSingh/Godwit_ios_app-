/**
 * Hotel Active Trip detail body — badges, DETAILS, requests, cancel, CTA, benefits.
 * Loaded by ActiveTripDetailScreen shell via serviceType switch.
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
import {
  GodwitBenefitsCard,
  SpecialRequestsCard,
} from '@/features/trips/hotel/HotelActiveTripSections';
import type { ActiveTripDetailBase } from '@/lib/firebase/sales/getActiveTripDetail';

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

type HotelActiveTripBodyProps = {
  detail: ActiveTripDetailBase;
  layout: ActiveTripBodyLayout;
};

export function HotelActiveTripBody({ detail, layout }: HotelActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

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

  return (
    <View style={styles.root}>
      <ActiveTripTitleBlock
        title={detail.title}
        subtitle={detail.subtitle}
        titleSize={layout.titleSize}
        titleLineHeight={layout.titleLineHeight}
        subtitleSize={layout.subtitleSize}
        subtitleStyle={styles.hotelSubtitle}
      />

      <ActiveTripChipRow chips={chips} />

      <ActiveTripDetailsCard
        rows={detailRows}
        detailValueSize={layout.detailValueSize}
        tone="hotel"
      />

      <SpecialRequestsCard lines={detail.specialRequests} />
      <CancellationTermsCard terms={detail.cancellationTerms} />
      {detail.showMessageGodwitCta ? <MessageGodwitCard /> : null}
      <GodwitBenefitsCard benefits={detail.godwitBenefits} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  hotelSubtitle: {
    marginTop: 4,
    marginBottom: 2,
  },
});
