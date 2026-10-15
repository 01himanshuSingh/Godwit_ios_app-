/**
 * Instant Sale Chauffeur → ActiveTripDetailBase for Active Trip screen.
 */
import type { DocumentData } from 'firebase/firestore';

import type { ActiveTripDetailBase } from '@/lib/firebase/sales/activeTripDetailTypes';
import { extractChauffeurSaleDetails } from '@/lib/firebase/sales/chauffeurServices/extractChauffeurSaleDetails';

type ChauffeurMapBase = Omit<
  ActiveTripDetailBase,
  'title' | 'subtitle' | 'detailRows' | 'missingForMockup'
>;

export function mapChauffeurDetail(
  data: DocumentData,
  _walkIn: DocumentData,
  _service: DocumentData | null,
  base: ChauffeurMapBase,
): ActiveTripDetailBase {
  const extracted = extractChauffeurSaleDetails(data);

  return {
    ...base,
    title: 'Chauffeur',
    subtitle: extracted.route,
    serviceTypeLabel: 'Chauffeur',
    inclusionBadge: base.inclusionBadge ?? 'Included in your trip',
    detailRows: extracted.detailRows,
    showMessageGodwitCta: true,
    missingForMockup: extracted.missingForMock,
  };
}
