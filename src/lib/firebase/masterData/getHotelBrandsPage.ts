/**
 * Cursor-paginated hotel brands from masterData/hotelBrands/items.
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
import type { HotelBrand, HotelBrandsPage } from '@/lib/firebase/masterData/hotelBrandTypes';
import { mapHotelBrandDoc } from '@/lib/firebase/masterData/mapHotelBrand';
import { withFirestoreTimeout } from '@/lib/firebase/withFirestoreTimeout';

export const HOTEL_BRANDS_PAGE_SIZE = 40;
export const HOTEL_BRANDS_QUICK_SELECT_SIZE = 5;

function brandsCollection() {
  return collection(db, 'masterData', 'hotelBrands', 'items');
}

export type GetHotelBrandsPageInput = {
  pageSize?: number;
  cursor?: HotelBrandsPage['nextCursor'];
  /** Prefix match on `name` (requires orderBy name). */
  namePrefix?: string;
};

export async function getHotelBrandsPage(
  input: GetHotelBrandsPageInput = {},
): Promise<HotelBrandsPage> {
  const pageSize = Math.min(Math.max(input.pageSize ?? HOTEL_BRANDS_PAGE_SIZE, 1), 100);
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

  const snap = await withFirestoreTimeout(`hotelBrands.page(${pageSize})`, () =>
    getDocs(query(brandsCollection(), ...constraints)),
  );

  const brands: HotelBrand[] = [];
  for (const docSnap of snap.docs) {
    const mapped = mapHotelBrandDoc(docSnap.id, docSnap.data());
    if (mapped && mapped.isActive) brands.push(mapped);
  }

  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null;

  return {
    brands,
    nextCursor: last,
    hasMore: snap.docs.length >= pageSize,
  };
}

/** First N brands for Stay-tab quick select chips. */
export async function getHotelBrandsQuickSelect(
  size: number = HOTEL_BRANDS_QUICK_SELECT_SIZE,
): Promise<HotelBrand[]> {
  const page = await getHotelBrandsPage({ pageSize: size });
  return page.brands.slice(0, size);
}
