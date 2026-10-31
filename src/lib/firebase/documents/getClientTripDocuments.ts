/**
 * Trips tab docs for a client — cursor pagination over sales.
 * Path: admins/{adminId}/clients/{clientId}/sales/{saleId}
 * Field: confirmationDoc (Storage URL)
 *
 * Page API = scalable (infinite query).
 * Full drain = testing / rare batch only.
 */

import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type Query,
} from 'firebase/firestore';

import { DocumentsScopeError } from '@/lib/firebase/documents/DocumentsScopeError';
import { mapDocumentsLoadErrorToMessage } from '@/lib/firebase/documents/mapDocumentsLoadError';
import { mapSaleToTripDocument } from '@/lib/firebase/documents/mapSaleToTripDocument';
import type {
  ClientTripDocumentsPage,
  GetClientTripDocumentsResult,
  TripDocumentItem,
  TripDocumentsPageCursor,
} from '@/lib/firebase/documents/tripDocumentTypes';
import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

/** Sales scanned per network round-trip (many sales lack confirmationDoc). */
export const TRIP_DOCS_SALES_PAGE_SIZE = 40;

function sortByTravelDateDesc(a: TripDocumentItem, b: TripDocumentItem): number {
  return String(b.travelDateKey || '').localeCompare(String(a.travelDateKey || ''));
}

/**
 * One sales page → trip docs that have confirmationDoc.
 * Cursor advances over all sales (not only docs), same as CRM list scan.
 */
export async function getClientTripDocumentsPage(
  adminId: string,
  clientId: string,
  cursor: TripDocumentsPageCursor = null,
  pageSize: number = TRIP_DOCS_SALES_PAGE_SIZE,
): Promise<ClientTripDocumentsPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new DocumentsScopeError();
  }

  return withFirestoreRetry('getClientTripDocumentsPage', async () => {
    const salesRef = collection(db, 'admins', aid, 'clients', cid, 'sales');
    const q: Query<DocumentData> = cursor
      ? query(salesRef, orderBy(documentId()), startAfter(cursor), limit(pageSize))
      : query(salesRef, orderBy(documentId()), limit(pageSize));

    const snap = await getDocs(q);
    const documents: TripDocumentItem[] = [];

    for (const d of snap.docs) {
      const item = mapSaleToTripDocument(d.id, d.data(), d.ref.path);
      if (item) documents.push(item);
    }

    documents.sort(sortByTravelDateDesc);

    const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length === pageSize;

    return {
      documents,
      nextCursor: hasMore ? last : null,
      hasMore,
    };
  });
}

/** Drain all sales pages (prefer page + infinite query in UI). */
export async function getClientTripDocuments(
  adminId: string,
  clientId: string,
): Promise<TripDocumentItem[]> {
  const all: TripDocumentItem[] = [];
  let cursor: TripDocumentsPageCursor = null;
  let hasMore = true;

  while (hasMore) {
    const page = await getClientTripDocumentsPage(adminId, clientId, cursor);
    all.push(...page.documents);
    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  const byPath = new Map<string, TripDocumentItem>();
  for (const doc of all) {
    byPath.set(doc.documentPath, doc);
  }

  return [...byPath.values()].sort(sortByTravelDateDesc);
}

export async function getClientTripDocumentsSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientTripDocumentsResult> {
  try {
    const documents = await getClientTripDocuments(adminId, clientId);
    return { documents, errorMessage: null };
  } catch (error) {
    const message = mapDocumentsLoadErrorToMessage(error, 'trips');
    console.error('[getClientTripDocuments]', error);
    return { documents: [], errorMessage: message };
  }
}
