/**
 * Instant Sale Private jet → ActiveTripDetailBase for Active Trip screen.
 */
import type { DocumentData } from 'firebase/firestore';

import type { ActiveTripDetailBase } from '@/lib/firebase/sales/activeTripDetailTypes';
import { extractPrivateJetSaleDetails } from '@/lib/firebase/sales/privateJetServices/extractPrivateJetSaleDetails';

type PrivateJetMapBase = Omit<
  ActiveTripDetailBase,
  'title' | 'subtitle' | 'detailRows' | 'missingForMockup'
>;

export function mapPrivateJetDetail(
  data: DocumentData,
  _walkIn: DocumentData,
  _service: DocumentData | null,
  base: PrivateJetMapBase,
): ActiveTripDetailBase {
  const extracted = extractPrivateJetSaleDetails(data);

  return {
    ...base,
    title: 'Private jet',
    subtitle: extracted.route,
    serviceTypeLabel: 'Private jet',
    detailRows: extracted.detailRows,
    showMessageGodwitCta: true,
    missingForMockup: extracted.missingForMock,
  };
}
