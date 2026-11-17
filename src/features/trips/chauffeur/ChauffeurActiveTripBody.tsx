/**
 * Chauffeur Active Trip detail body — premium chrome.
 * Rows: VEHICLE / ROUTE / TRAVELLERS (same extract as before; UI only).
 */
import { useMemo } from 'react';

import type { ActiveTripBodyLayout } from '@/features/trips/components/ActiveTripDetailParts';
import {
  ActiveTripPremiumShell,
  buildPremiumStatusChips,
} from '@/features/trips/components/ActiveTripPremiumShell';
import { extractChauffeurSaleDetails } from '@/lib/firebase/sales/chauffeurServices';
import type { ActiveTripDetailBase, DetailRow } from '@/lib/firebase/sales/getActiveTripDetail';

const CHAUFFEUR_DETAIL_ROW_ORDER = ['VEHICLE', 'ROUTE', 'TRAVELLERS'] as const;
const DETAIL_VALUE_MEDIUM = new Set(['VEHICLE', 'ROUTE', 'TRAVELLERS']);

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

function rowValue(rows: DetailRow[], label: string): string | null {
  return rows.find((r) => r.label === label)?.value?.trim() || null;
}

export function ChauffeurActiveTripBody({ detail, layout: _layout }: ChauffeurActiveTripBodyProps) {
  const { detailRows, subtitle, summary } = useMemo(() => {
    const extracted = extractChauffeurSaleDetails(detail.raw ?? {});

    let rows = [...(detail.detailRows ?? [])];
    rows = upsertRow(rows, 'VEHICLE', extracted.vehicle);
    rows = upsertRow(rows, 'ROUTE', extracted.route);
    rows = upsertRow(rows, 'TRAVELLERS', extracted.travellers);
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

    const vehicle = rowValue(sorted, 'VEHICLE');
    const route = rowValue(sorted, 'ROUTE');
    const travellers = rowValue(sorted, 'TRAVELLERS');

    return {
      detailRows: sorted,
      subtitle: detail.subtitle ?? extracted.route,
      summary: [
        vehicle ? { key: 'vehicle', label: 'VEHICLE', value: vehicle } : null,
        route ? { key: 'route', label: 'ROUTE', value: route } : null,
        travellers ? { key: 'travellers', label: 'TRAVELLERS', value: travellers } : null,
      ].filter(Boolean) as { key: string; label: string; value: string }[],
    };
  }, [detail.detailRows, detail.raw, detail.subtitle]);

  const statusChips = useMemo(() => buildPremiumStatusChips(detail), [detail]);

  return (
    <ActiveTripPremiumShell
      typeLabel={detail.serviceTypeLabel || 'Chauffeur'}
      iconName="car-outline"
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
