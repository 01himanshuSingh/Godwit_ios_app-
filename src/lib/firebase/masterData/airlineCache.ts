/**
 * In-memory airline index for cabinClasses lookups by airlineId.
 * Populated by list/quick-select fetches and single-doc reads.
 */
import type { Airline } from '@/lib/firebase/masterData/airlineTypes';

const airlinesById = new Map<string, Airline>();

export function cacheAirline(airline: Airline): void {
  airlinesById.set(airline.airlineId, airline);
}

export function cacheAirlines(airlines: Airline[]): void {
  for (const airline of airlines) cacheAirline(airline);
}

export function getCachedAirline(airlineId: string): Airline | undefined {
  return airlinesById.get(airlineId);
}

/** Sync cabin classes from cache — empty if airline not loaded yet. */
export function getCabinClassesFromCache(airlineId: string): string[] {
  const airline = airlinesById.get(airlineId);
  return airline?.cabinClasses?.filter(Boolean) ?? [];
}
