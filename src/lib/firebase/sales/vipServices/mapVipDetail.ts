/**
 * Instant Sale Airport VIP Meet → ActiveTripDetailBase for Active Trip screen.
 */
import type { DocumentData } from 'firebase/firestore';

import type { ActiveTripDetailBase } from '@/lib/firebase/sales/activeTripDetailTypes';
import { extractVipSaleDetails } from '@/lib/firebase/sales/vipServices/extractVipSaleDetails';

type VipMapBase = Omit<
  ActiveTripDetailBase,
  'title' | 'subtitle' | 'detailRows' | 'missingForMockup'
>;

export function mapVipDetail(
  data: DocumentData,
  _walkIn: DocumentData,
  _service: DocumentData | null,
  base: VipMapBase,
): ActiveTripDetailBase {
  const extracted = extractVipSaleDetails(data);

  return {
    ...base,
    title: 'Airport VIP',
    subtitle: extracted.service,
    serviceTypeLabel: 'Airport VIP',
    inclusionBadge: base.inclusionBadge ?? 'Included in your trip',
    detailRows: extracted.detailRows,
    showMessageGodwitCta: true,
    missingForMockup: extracted.missingForMock,
  };
}
