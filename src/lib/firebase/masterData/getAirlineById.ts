/**
 * Single airline doc: masterData/airlines/items/{airlineId}
 */
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { cacheAirline, getCachedAirline } from '@/lib/firebase/masterData/airlineCache';
import type { Airline } from '@/lib/firebase/masterData/airlineTypes';
import { mapAirlineDoc } from '@/lib/firebase/masterData/mapAirline';
import { withFirestoreTimeout } from '@/lib/firebase/withFirestoreTimeout';

export async function getAirlineById(airlineId: string): Promise<Airline | null> {
  const id = (airlineId || '').trim();
  if (!id) return null;

  const cached = getCachedAirline(id);
  if (cached) return cached;

  const snap = await withFirestoreTimeout(`airlines.doc(${id})`, () =>
    getDoc(doc(db, 'masterData', 'airlines', 'items', id)),
  );

  if (!snap.exists()) return null;

  const mapped = mapAirlineDoc(snap.id, snap.data());
  if (!mapped || !mapped.isActive) return null;

  cacheAirline(mapped);
  return mapped;
}

/**
 * Cabin classes for an airline:
 * masterData/airlines/items/{airlineId}.cabinClasses[]
 */
export async function getCabinClasses(airlineId: string): Promise<string[]> {
  const airline = await getAirlineById(airlineId);
  return airline?.cabinClasses?.filter(Boolean) ?? [];
}
