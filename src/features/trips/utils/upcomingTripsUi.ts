import type { ClientSaleTrip, SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

export type UpcomingDayGroup = {
  id: string;
  dateKey: string;
  label: string;
  trips: ClientSaleTrip[];
};

/** e.g. 2026-10-31 → "SAT 31 OCT" */
export function formatTripDateHeader(dateKey: string): string {
  const parsed = Date.parse(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed)) {
    return dateKey.toUpperCase();
  }
  const d = new Date(parsed);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return `${weekday} ${day} ${month}`;
}

export function tripTitle(trip: ClientSaleTrip): string {
  return (
    trip.displayTitle?.trim() ||
    trip.hotelBrand?.trim() ||
    trip.serviceName?.trim() ||
    trip.serviceTypeLabel ||
    'Booking'
  );
}

export function serviceTypeListLabel(type: SaleServiceType): string {
  switch (type) {
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return 'FLIGHT';
    case 'privateJet':
      return 'PRIVATE JET';
    case 'yacht':
      return 'YACHT';
    case 'vip':
      return 'AIRPORT VIP';
    case 'chauffeur':
      return 'CHAUFFEUR';
    case 'hotel':
    case 'hotelRoomExtension':
      return 'HOTEL';
    case 'visa':
      return 'VISA';
    case 'experiences':
      return 'EXPERIENCE';
    default:
      return 'SERVICE';
  }
}

/** One card per travel date — trips render inside with bottom underlines. */
export function buildUpcomingDayGroups(trips: ClientSaleTrip[]): UpcomingDayGroup[] {
  const byDate = new Map<string, ClientSaleTrip[]>();

  for (const trip of trips) {
    const key = trip.travelDateKey ?? 'unknown';
    const list = byDate.get(key) ?? [];
    list.push(trip);
    byDate.set(key, list);
  }

  const keys = [...byDate.keys()].sort((a, b) => {
    if (a === 'unknown') {
      return 1;
    }
    if (b === 'unknown') {
      return -1;
    }
    return a.localeCompare(b);
  });

  return keys.map((dateKey) => ({
    id: `day-${dateKey}`,
    dateKey,
    label: dateKey === 'unknown' ? 'DATE TBD' : formatTripDateHeader(dateKey),
    trips: byDate.get(dateKey) ?? [],
  }));
}
