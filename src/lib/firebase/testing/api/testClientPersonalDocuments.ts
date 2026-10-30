/**
 * Testing helper — Personal docs (passport / visa / membership) for session client.
 * Testing tab only — exercises getClientPersonalDocuments.
 *
 * Flow: travellers → customerProfile → rows with docUrl
 */

import { getTravellersForClient } from '@/lib/firebase/customers/getTravellersForClient';
import { getClientPersonalDocuments, type PersonalDocumentItem } from '@/lib/firebase/documents';

export type ClientPersonalDocumentsReport = {
  adminId: string | null;
  clientId: string | null;
  travellersScanned: number;
  documentsFound: number;
  documents: PersonalDocumentItem[];
  errorMessage: string | null;
};

function emptyReport(
  errorMessage: string | null = null,
  adminId: string | null = null,
  clientId: string | null = null,
): ClientPersonalDocumentsReport {
  return {
    adminId,
    clientId,
    travellersScanned: 0,
    documentsFound: 0,
    documents: [],
    errorMessage,
  };
}

/**
 * Load all personal docs for the session client (full drain — Testing tab only).
 */
export async function testClientPersonalDocuments(
  adminId: string,
  clientId: string,
): Promise<ClientPersonalDocumentsReport> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    return emptyReport('adminId and clientId are required');
  }

  try {
    const travellers = await getTravellersForClient(aid, cid);
    const documents = await getClientPersonalDocuments(aid, cid);

    return {
      adminId: aid,
      clientId: cid,
      travellersScanned: travellers.length,
      documentsFound: documents.length,
      documents,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load personal documents';
    console.error('[testClientPersonalDocuments]', error);
    return emptyReport(message, aid, cid);
  }
}

export function logClientPersonalDocuments(report: ClientPersonalDocumentsReport): void {
  console.log(
    '[personal-docs-test]',
    `travellers=${report.travellersScanned}`,
    `docs=${report.documentsFound}`,
    report.errorMessage ? `error=${report.errorMessage}` : '',
  );
  for (const d of report.documents) {
    console.log(
      '[personal-docs-test]',
      `type=${d.type}`,
      `customerId=${d.customerId}`,
      `title=${d.title}`,
      `url=${d.url.slice(0, 80)}…`,
    );
  }
}
