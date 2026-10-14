/**
 * Fallback Active Trip body for air / VIP / chauffeur until those folders exist.
 */
import { useMemo } from 'react';
import { View } from 'react-native';

import {
  ActiveTripChipRow,
  ActiveTripDetailsCard,
  ActiveTripTitleBlock,
  buildDetailChips,
  type ActiveTripBodyLayout,
} from '@/features/trips/components/ActiveTripDetailParts';
import { CancellationTermsCard } from '@/features/trips/components/CancellationTermsCard';
import { MessageGodwitCard } from '@/features/trips/components/MessageGodwitCard';
import type { ActiveTripDetailBase } from '@/lib/firebase/sales/getActiveTripDetail';

type GenericActiveTripBodyProps = {
  detail: ActiveTripDetailBase;
  layout: ActiveTripBodyLayout;
};

export function GenericActiveTripBody({ detail, layout }: GenericActiveTripBodyProps) {
  const chips = useMemo(() => buildDetailChips(detail), [detail]);

  return (
    <View style={{ width: '100%' }}>
      <ActiveTripTitleBlock
        title={detail.title}
        subtitle={detail.subtitle}
        titleSize={layout.titleSize}
        titleLineHeight={layout.titleLineHeight}
        subtitleSize={layout.subtitleSize}
      />

      <ActiveTripChipRow chips={chips} />

      <ActiveTripDetailsCard rows={detail.detailRows} detailValueSize={layout.detailValueSize} />

      <CancellationTermsCard terms={detail.cancellationTerms} />
      {detail.showMessageGodwitCta ? <MessageGodwitCard /> : null}
    </View>
  );
}
