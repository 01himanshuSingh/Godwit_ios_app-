/**
 * Personal tab docs for a client — cursor pagination over travellers.
 *
 * Flow:
 *   1) travellers linked to client (clientIds / clientId)
 *   2) each customerId → loadCustomerProfile
 *   3) collect passports / visas / memberships with docUrl
 *
 * Page API = scalable (infinite query over travellers).
 * Full drain = rare / testing.
 */

import { getTravellersForClient } from '@/lib/firebase/customers/getTravellersForClient';
import { loadCustomerProfile } from '@/lib/firebase/customers/loadCustomerProfile';
import { DocumentsScopeError } from '@/lib/firebase/documents/DocumentsScopeError';
import { mapDocumentsLoadErrorToMessage } from '@/lib/firebase/documents/mapDocumentsLoadError';
import { mapCustomerProfileToPersonalDocs } from '@/lib/firebase/documents/mapCustomerProfileToPersonalDocs';
import type {
  ClientPersonalDocumentsPage,
  GetClientPersonalDocumentsResult,
  PersonalDocumentItem,
  PersonalDocumentsPageCursor,
} from '@/lib/firebase/documents/personalDocumentTypes';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

/** Travellers (profiles) loaded per network page. */
export const PERSONAL_DOCS_TRAVELLER_PAGE_SIZE = 8;

function sortByDateDesc(a: PersonalDocumentItem, b: PersonalDocumentItem): number {
  return String(b.dateKey || '').localeCompare(String(a.dateKey || ''));
}

function dedupeByPath(docs: PersonalDocumentItem[]): PersonalDocumentItem[] {
  const byPath = new Map<string, PersonalDocumentItem>();
  for (const doc of docs) {
    byPath.set(doc.documentPath, doc);
  }
  return [...byPath.values()];
}

/**
 * One travellers page → personal docs that have a Storage URL.
 * Cursor is the next traveller offset (not doc count).
 */
export async function getClientPersonalDocumentsPage(
  adminId: string,
  clientId: string,
  cursor: PersonalDocumentsPageCursor = null,
  pageSize: number = PERSONAL_DOCS_TRAVELLER_PAGE_SIZE,
): Promise<ClientPersonalDocumentsPage> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new DocumentsScopeError();
  }

  return withFirestoreRetry('getClientPersonalDocumentsPage', async () => {
    const travellers = await getTravellersForClient(aid, cid);
    const offset = cursor ?? 0;

    // No travellers / exhausted offset → empty page (valid, not an error).
    if (offset >= travellers.length) {
      return { documents: [], nextCursor: null, hasMore: false };
    }

    const slice = travellers.slice(offset, offset + pageSize);
    const batches = await Promise.all(
      slice.map(async (t) => {
        try {
          const profile = await loadCustomerProfile(aid, t.customerId);
          const profilePath = `admins/${aid}/customers/${t.customerId}/customerProfile`;
          return mapCustomerProfileToPersonalDocs(
            t.customerId,
            t.name || 'Traveller',
            profile,
            profilePath,
          );
        } catch (error) {
          // Missing profile / decrypt noise for one traveller — skip, keep listing others.
          console.warn('[getClientPersonalDocumentsPage] traveller skipped', t.customerId, error);
          return [];
        }
      }),
    );

    const documents = dedupeByPath(batches.flat()).sort(sortByDateDesc);
    const nextOffset = offset + slice.length;
    const hasMore = nextOffset < travellers.length;

    return {
      documents,
      nextCursor: hasMore ? nextOffset : null,
      hasMore,
    };
  });
}

/** Drain all traveller pages (prefer page + infinite query in UI). */
export async function getClientPersonalDocuments(
  adminId: string,
  clientId: string,
): Promise<PersonalDocumentItem[]> {
  const all: PersonalDocumentItem[] = [];
  let cursor: PersonalDocumentsPageCursor = null;
  let hasMore = true;

  while (hasMore) {
    const page = await getClientPersonalDocumentsPage(adminId, clientId, cursor);
    all.push(...page.documents);
    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  return dedupeByPath(all).sort(sortByDateDesc);
}

export async function getClientPersonalDocumentsSafe(
  adminId: string,
  clientId: string,
): Promise<GetClientPersonalDocumentsResult> {
  try {
    const documents = await getClientPersonalDocuments(adminId, clientId);
    return { documents, errorMessage: null };
  } catch (error) {
    const message = mapDocumentsLoadErrorToMessage(error, 'personal');
    console.error('[getClientPersonalDocuments]', error);
    return { documents: [], errorMessage: message };
  }
}
