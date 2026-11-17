/**
 * Fallback Active Trip body for visa / experiences / other services.
 * Premium chrome; same detail.detailRows mapping as before (UI only).
 */
import { useMemo } from 'react';

import type { ActiveTripBodyLayout } from '@/features/trips/components/ActiveTripDetailParts';
import {
  ActiveTripPremiumShell,
  buildPremiumStatusChips,
} from '@/features/trips/components/ActiveTripPremiumShell';
import type { ActiveTripDetailBase } from '@/lib/firebase/sales/getActiveTripDetail';

type GenericActiveTripBodyProps = {
  detail: ActiveTripDetailBase;
  layout: ActiveTripBodyLayout;
};

export function GenericActiveTripBody({ detail, layout: _layout }: GenericActiveTripBodyProps) {
  const statusChips = useMemo(() => buildPremiumStatusChips(detail), [detail]);

  const summary = useMemo(() => {
    const rows = detail.detailRows ?? [];
    return rows.slice(0, 3).map((row, index) => ({
      key: `${row.label}-${index}`,
      label: row.label,
      value: row.value,
    }));
  }, [detail.detailRows]);

  return (
    <ActiveTripPremiumShell
      typeLabel={detail.serviceTypeLabel || 'Service'}
      iconName="briefcase-outline"
      title={detail.title}
      subtitle={detail.subtitle}
      statusChips={statusChips}
      summary={summary}
      detailRows={detail.detailRows ?? []}
      cancellationTerms={detail.cancellationTerms}
      showMessageGodwitCta={detail.showMessageGodwitCta}
    />
  );
}
