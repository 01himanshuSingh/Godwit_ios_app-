/**
 * Instant Sale AIR → ActiveTripDetailBase for Active Trip screen.
 */
import type { DocumentData } from 'firebase/firestore';

import type { ActiveTripDetailBase } from '@/lib/firebase/sales/activeTripDetailTypes';
import { extractAirSaleFlightDetails } from '@/lib/firebase/sales/airServices/extractAirSaleFlightDetails';

type AirMapBase = Omit<
  ActiveTripDetailBase,
  'title' | 'subtitle' | 'detailRows' | 'missingForMockup'
>;

export function mapAirDetail(
  data: DocumentData,
  _walkIn: DocumentData,
  _service: DocumentData | null,
  base: AirMapBase,
): ActiveTripDetailBase {
  const extracted = extractAirSaleFlightDetails(data);

  const confirmationNo = extracted.bookingRef ?? base.confirmationNo;
  const confirmationBadge = confirmationNo
    ? /^confirmation\b/i.test(confirmationNo)
      ? confirmationNo
      : `Confirmation ${confirmationNo}`
    : base.confirmationBadge;

  return {
    ...base,
    title: extracted.title,
    subtitle: extracted.subtitle,
    serviceTypeLabel:
      base.serviceType === 'airExtras'
        ? 'Air extras'
        : base.serviceType === 'airReissue'
          ? 'Air reissue'
          : 'Air',
    confirmationNo,
    confirmationBadge,
    detailRows: extracted.detailRows,
    showMessageGodwitCta: true,
    missingForMockup: extracted.missingForMock,
  };
}
