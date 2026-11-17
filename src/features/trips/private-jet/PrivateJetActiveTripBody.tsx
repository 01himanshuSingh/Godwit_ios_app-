/**
 * Private jet Active Trip detail body — premium chrome.
 * Rows: CARRIER / AIRCRAFT / ROUTE / TRAVELLERS (same extract as before; UI only).
 */
import { useMemo } from 'react';

import type { ActiveTripBodyLayout } from '@/features/trips/components/ActiveTripDetailParts';
import {
  ActiveTripPremiumShell,
  buildPremiumStatusChips,
} from '@/features/trips/components/ActiveTripPremiumShell';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';
import { extractPrivateJetSaleDetails } from '@/lib/firebase/sales/privateJetServices';

const PRIVATE_JET_DETAIL_ROW_ORDER = ['CARRIER', 'AIRCRAFT', 'ROUTE', 'TRAVELLERS'] as const;
const DETAIL_VALUE_MEDIUM = new Set(['CARRIER', 'AIRCRAFT', 'ROUTE', 'TRAVELLERS']);

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

function rowValue(rows: DetailRow[], label: string): string | null {
  return rows.find((r) => r.label === label)?.value?.trim() || null;
}

export function PrivateJetActiveTripBody({
  detail,
  layout: _layout,
}: PrivateJetActiveTripBodyProps) {
  const { detailRows, subtitle, summary } = useMemo(() => {
    const extracted = extractPrivateJetSaleDetails(detail.raw ?? {});

    let rows = [...(detail.detailRows ?? [])];
    rows = upsertRow(rows, 'CARRIER', extracted.carrier);
    rows = upsertRow(rows, 'AIRCRAFT', extracted.aircraft);
    rows = upsertRow(rows, 'ROUTE', extracted.route);
    rows = upsertRow(rows, 'TRAVELLERS', extracted.travellers);
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

    const carrier = rowValue(sorted, 'CARRIER');
    const aircraft = rowValue(sorted, 'AIRCRAFT');
    const route = rowValue(sorted, 'ROUTE');

    return {
      detailRows: sorted,
      subtitle: detail.subtitle ?? extracted.route,
      summary: [
        carrier ? { key: 'carrier', label: 'CARRIER', value: carrier } : null,
        aircraft ? { key: 'aircraft', label: 'AIRCRAFT', value: aircraft } : null,
        route ? { key: 'route', label: 'ROUTE', value: route } : null,
      ].filter(Boolean) as { key: string; label: string; value: string }[],
    };
  }, [detail.detailRows, detail.raw, detail.subtitle]);

  const statusChips = useMemo(() => buildPremiumStatusChips(detail), [detail]);

  return (
    <ActiveTripPremiumShell
      typeLabel={detail.serviceTypeLabel || 'Private jet'}
      iconName="airplane"
      title={detail.title}
      subtitle={subtitle}
      statusChips={statusChips}
      summary={summary}
      detailRows={detailRows}
      detailValueMediumLabels={DETAIL_VALUE_MEDIUM}
      cancellationTerms={detail.cancellationTerms}
      showMessageGodwitCta={detail.showMessageGodwitCta}
    />
  );
}
