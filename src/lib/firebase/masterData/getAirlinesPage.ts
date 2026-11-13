/**
 * Cursor-paginated airlines from masterData/airlines/items.
 * Supports optional name prefix search without loading the full catalog.
 */
import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { cacheAirlines } from '@/lib/firebase/masterData/airlineCache';
import type { Airline, AirlinesPage } from '@/lib/firebase/masterData/airlineTypes';
import { mapAirlineDoc } from '@/lib/firebase/masterData/mapAirline';
import { withFirestoreTimeout } from '@/lib/firebase/withFirestoreTimeout';

export const AIRLINES_PAGE_SIZE = 40;
export const AIRLINES_QUICK_SELECT_SIZE = 5;

function airlinesCollection() {
  return collection(db, 'masterData', 'airlines', 'items');
}

export type GetAirlinesPageInput = {
  pageSize?: number;
  cursor?: AirlinesPage['nextCursor'];
  /** Prefix match on `name` (requires orderBy name). */
  namePrefix?: string;
};

export async function getAirlinesPage(input: GetAirlinesPageInput = {}): Promise<AirlinesPage> {
  const pageSize = Math.min(Math.max(input.pageSize ?? AIRLINES_PAGE_SIZE, 1), 100);
  const prefix = (input.namePrefix || '').trim();

  const constraints: QueryConstraint[] = [orderBy('name', 'asc')];

  if (input.cursor) {
    constraints.push(startAfter(input.cursor));
  } else if (prefix) {
    constraints.push(startAt(prefix));
  }

  if (prefix) {
    constraints.push(endAt(`${prefix}\uf8ff`));
  }

  constraints.push(limit(pageSize));

  const snap = await withFirestoreTimeout(`airlines.page(${pageSize})`, () =>
    getDocs(query(airlinesCollection(), ...constraints)),
  );

  const airlines: Airline[] = [];
  for (const docSnap of snap.docs) {
    const mapped = mapAirlineDoc(docSnap.id, docSnap.data());
    if (mapped && mapped.isActive) airlines.push(mapped);
  }

  cacheAirlines(airlines);

  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null;

  return {
    airlines,
    nextCursor: last,
    hasMore: snap.docs.length >= pageSize,
  };
}

/** First N airlines for Trip-tab quick select chips. */
export async function getAirlinesQuickSelect(
  size: number = AIRLINES_QUICK_SELECT_SIZE,
): Promise<Airline[]> {
  const page = await getAirlinesPage({ pageSize: size });
  return page.airlines.slice(0, size);
}
