/**
 * Pure: ClientSaleTrip[] → Home trip spotlight card | null
 *
 * Priority:
 *   1) current cluster (start ≤ today ≤ end)
 *   2) else soonest upcoming cluster (travelDate > today)
 *   3) else null
 */

import { coverUrlForServiceType } from '@/lib/firebase/sales/currentTrip/coverPlaceholders';
import type {
  ClientCurrentTripCard,
  CurrentTripNextUp,
  CurrentTripServiceChip,
  CurrentTripServiceIcon,
  HomeTripCardMode,
} from '@/lib/firebase/sales/currentTrip/currentTripCardTypes';
import type { ClientSaleTrip, SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalKey(now = new Date()): string {
  return formatLocalDateKey(now);
}

/** Inclusive night count between YYYY-MM-DD keys (hotel-style). */
export function dayDiff(startKey: string, endKey: string): number {
  const a = Date.parse(`${startKey}T12:00:00`);
  const b = Date.parse(`${endKey}T12:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function saleStart(s: ClientSaleTrip): string | null {
  return s.travelDateKey;
}

function saleEnd(s: ClientSaleTrip): string | null {
  return s.endDateKey || s.travelDateKey;
}

/** In-window: start <= today <= end */
export function isCurrentSale(s: ClientSaleTrip, today: string): boolean {
  if (!s.saleStatus || !s.travelDateKey) return false;
  const start = saleStart(s);
  const end = saleEnd(s);
  if (!start || !end) return false;
  return start <= today && today <= end;
}

/**
 * hotel / hotelRoomExtension → yacht → experiences → air* → chauffeur → vip → other
 */
export function primaryServiceRank(type: SaleServiceType): number {
  switch (type) {
    case 'hotel':
    case 'hotelRoomExtension':
      return 0;
    case 'yacht':
      return 1;
    case 'experiences':
      return 2;
    case 'air':
    case 'airExtras':
    case 'airReissue':
    case 'privateJet':
      return 3;
    case 'chauffeur':
      return 4;
    case 'vip':
      return 5;
    case 'visa':
      return 6;
    default:
      return 7;
  }
}

export function pickPrimarySale(current: ClientSaleTrip[]): ClientSaleTrip {
  return [...current].sort((a, b) => {
    const ra = primaryServiceRank(a.serviceType);
    const rb = primaryServiceRank(b.serviceType);
    if (ra !== rb) return ra - rb;
    const sa = saleStart(a) || '';
    const sb = saleStart(b) || '';
    if (sa !== sb) return sa.localeCompare(sb);
    const ea = saleEnd(a) || '';
    const eb = saleEnd(b) || '';
    return eb.localeCompare(ea);
  })[0]!;
}

function uniqueTravellerCount(cluster: ClientSaleTrip[]): number {
  const keys = new Set<string>();
  for (const sale of cluster) {
    for (const t of sale.travellers) {
      const k = (t.id || t.name || '').trim().toLowerCase();
      if (k) keys.add(k);
    }
  }
  return keys.size;
}

function formatRangeLabel(startKey: string, endKey: string): string {
  const start = new Date(`${startKey}T12:00:00`);
  const end = new Date(`${endKey}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startKey} – ${endKey}`;
  }
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    const month = start.toLocaleDateString('en-GB', { month: 'long' });
    return `${start.getDate()}–${end.getDate()} ${month}`;
  }
  const left = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const right = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${left} – ${right}`;
}

function cardTitle(primary: ClientSaleTrip): string {
  return (
    primary.destinationCity?.trim() ||
    primary.hotelBrand?.trim() ||
    primary.displayTitle?.trim() ||
    primary.serviceName?.trim() ||
    primary.serviceTypeLabel ||
    'Current trip'
  );
}

function placeLine(primary: ClientSaleTrip): string | null {
  if (primary.serviceType === 'hotel' || primary.serviceType === 'hotelRoomExtension') {
    const brand = primary.hotelBrand?.trim() || primary.displayTitle?.trim();
    const city = primary.destinationCity?.trim();
    if (brand && city && !brand.toLowerCase().includes(city.toLowerCase())) {
      return `${brand}, ${city}`;
    }
    return brand || city || primary.detailLine || primary.displayTitle || null;
  }
  return primary.detailLine?.trim() || primary.displayTitle?.trim() || null;
}

function iconForType(type: SaleServiceType): CurrentTripServiceIcon {
  switch (type) {
    case 'privateJet':
      return 'private-jet';
    case 'hotel':
    case 'hotelRoomExtension':
      return 'villa';
    case 'chauffeur':
      return 'chauffeur';
    case 'yacht':
      return 'yacht';
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return 'flight';
    case 'vip':
      return 'vip';
    case 'experiences':
      return 'experience';
    default:
      return 'other';
  }
}

function chipLabel(type: SaleServiceType): string {
  switch (type) {
    case 'privateJet':
      return 'Private jet';
    case 'hotel':
    case 'hotelRoomExtension':
      return 'Villa';
    case 'chauffeur':
      return 'Chauffeur';
    case 'yacht':
      return 'Yacht';
    case 'air':
    case 'airExtras':
    case 'airReissue':
      return 'Flight';
    case 'vip':
      return 'Airport VIP';
    case 'experiences':
      return 'Experience';
    default:
      return 'Service';
  }
}

function chipGroupKey(type: SaleServiceType): SaleServiceType {
  if (type === 'hotelRoomExtension') return 'hotel';
  if (type === 'airExtras' || type === 'airReissue') return 'air';
  return type;
}

function uniqueServiceChips(cluster: ClientSaleTrip[]): CurrentTripServiceChip[] {
  const seen = new Set<SaleServiceType>();
  const chips: CurrentTripServiceChip[] = [];
  for (const sale of cluster) {
    const group = chipGroupKey(sale.serviceType);
    if (seen.has(group)) continue;
    seen.add(group);
    chips.push({
      id: group,
      label: chipLabel(group),
      icon: iconForType(group),
      serviceType: group,
    });
  }
  return chips;
}

/** Best-effort ms for "next" sorting. */
export function saleDateTimeMs(sale: ClientSaleTrip): number | null {
  const key = sale.travelDateKey;
  if (!key) return null;

  const raw = sale.travelDateRaw?.trim();
  if (raw && raw.includes('T')) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }

  const hm = sale.displayTime?.trim();
  if (hm && /^\d{1,2}:\d{2}/.test(hm)) {
    const [h, m] = hm.split(':');
    const d = new Date(`${key}T${h.padStart(2, '0')}:${m.slice(0, 2).padStart(2, '0')}:00`);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }

  const d = new Date(`${key}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function pickNextUp(
  cluster: ClientSaleTrip[],
  allSales: ClientSaleTrip[],
  nowMs: number,
): CurrentTripNextUp | null {
  const today = formatLocalDateKey(new Date(nowMs));
  const upcoming = allSales.filter(
    (s) => s.saleStatus && s.travelDateKey && s.travelDateKey > today,
  );
  const pool = [...cluster, ...upcoming];

  const ranked = pool
    .map((s) => ({ sale: s, at: saleDateTimeMs(s) }))
    .filter((x): x is { sale: ClientSaleTrip; at: number } => x.at != null && x.at > nowMs)
    .sort((a, b) => a.at - b.at);

  const next = ranked[0]?.sale;
  if (!next) return null;

  const time = next.displayTime;
  const label = next.serviceTypeLabel;
  return {
    saleId: next.saleId,
    label,
    time,
    displayLabel: time ? `${label} · ${time}` : label,
  };
}

/**
 * Prefer same destinationCity as primary when set; else full candidate set.
 */
export function clusterCurrentSales(
  candidates: ClientSaleTrip[],
  primary: ClientSaleTrip,
): ClientSaleTrip[] {
  const city = primary.destinationCity?.trim().toLowerCase();
  if (!city || candidates.length <= 1) return candidates;
  const sameCity = candidates.filter(
    (s) => (s.destinationCity?.trim().toLowerCase() || '') === city,
  );
  return sameCity.length > 0 ? sameCity : candidates;
}

export function isUpcomingSale(s: ClientSaleTrip, today: string): boolean {
  return Boolean(s.saleStatus && s.travelDateKey && s.travelDateKey > today);
}

/**
 * Soonest upcoming day → all sales starting that day → primary + city cluster.
 */
export function pickUpcomingCluster(
  allSales: ClientSaleTrip[],
  today: string,
): ClientSaleTrip[] | null {
  const upcoming = allSales
    .filter((s) => isUpcomingSale(s, today))
    .sort((a, b) => (a.travelDateKey || '').localeCompare(b.travelDateKey || ''));

  if (!upcoming.length) return null;

  const nextStart = upcoming[0]!.travelDateKey!;
  const sameStart = upcoming.filter((s) => s.travelDateKey === nextStart);
  const primary = pickPrimarySale(sameStart);
  return clusterCurrentSales(sameStart, primary);
}

function sectionLabelFor(mode: HomeTripCardMode): string {
  return mode === 'current' ? 'YOUR CURRENT TRIP' : 'YOUR UPCOMING TRIP';
}

/** Shared mapper: cluster of sales → card view model. */
export function composeTripClusterCard(
  cluster: ClientSaleTrip[],
  allSales: ClientSaleTrip[],
  mode: HomeTripCardMode,
  now: Date,
): ClientCurrentTripCard | null {
  if (!cluster.length) return null;

  const today = todayLocalKey(now);
  const primary = pickPrimarySale(cluster);

  const startDate = cluster
    .map((s) => saleStart(s))
    .filter((k): k is string => Boolean(k))
    .sort()[0]!;
  const endDate = cluster
    .map((s) => saleEnd(s))
    .filter((k): k is string => Boolean(k))
    .sort()
    .at(-1)!;

  const nights = Math.max(dayDiff(startDate, endDate), 0);
  const range = formatRangeLabel(startDate, endDate);
  const nightsPart = nights === 1 ? '1 night' : `${nights} nights`;

  let dayIndex: number | null = null;
  let dayLabel: string | null = null;
  let dateSummary: string;

  if (mode === 'current') {
    const span = Math.max(nights, 1);
    dayIndex = clamp(dayDiff(startDate, today) + 1, 1, span);
    dayLabel = `Day ${dayIndex} of ${span}`;
    dateSummary = nights > 0 ? `${range} · ${nightsPart} · ${dayLabel}` : `${range} · ${dayLabel}`;
  } else {
    // Upcoming — no day-of-trip progress yet
    dateSummary = nights > 0 ? `${range} · ${nightsPart}` : range;
  }

  const travellerCount = uniqueTravellerCount(cluster);
  const servicesCount = cluster.length;
  const travellersPart = travellerCount === 1 ? '1 travelling' : `${travellerCount} travelling`;
  const servicesPart =
    servicesCount === 1 ? '1 service arranged' : `${servicesCount} services arranged`;

  return {
    mode,
    sectionLabel: sectionLabelFor(mode),
    primarySaleId: primary.saleId,
    saleIds: cluster.map((s) => s.saleId),
    title: cardTitle(primary),
    placeLine: placeLine(primary),
    startDate,
    endDate,
    nights,
    dayIndex,
    dayLabel,
    dateSummary,
    travellerCount,
    servicesCount,
    partySummary: `${travellersPart} · ${servicesPart}`,
    serviceTypes: [...new Set(cluster.map((s) => s.serviceType))],
    services: uniqueServiceChips(cluster),
    nextUp: pickNextUp(cluster, allSales, now.getTime()),
    coverUrl: coverUrlForServiceType(primary.serviceType),
  };
}

/**
 * Home spotlight: current first, else next upcoming, else null.
 */
export function buildHomeTripSpotlightCard(
  allSales: ClientSaleTrip[],
  now = new Date(),
): ClientCurrentTripCard | null {
  const today = todayLocalKey(now);

  const current = allSales.filter((s) => isCurrentSale(s, today));
  if (current.length) {
    const primary = pickPrimarySale(current);
    const cluster = clusterCurrentSales(current, primary);
    return composeTripClusterCard(cluster, allSales, 'current', now);
  }

  const upcomingCluster = pickUpcomingCluster(allSales, today);
  if (upcomingCluster?.length) {
    return composeTripClusterCard(upcomingCluster, allSales, 'upcoming', now);
  }

  return null;
}

/** @deprecated Prefer buildHomeTripSpotlightCard — kept as alias. */
export function buildClientCurrentTripCard(
  allSales: ClientSaleTrip[],
  now = new Date(),
): ClientCurrentTripCard | null {
  return buildHomeTripSpotlightCard(allSales, now);
}
