import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import {
  setTestingClientSession,
  TEST_CLIENT_LOOKUP_ADMIN_ID,
  TEST_CLIENT_LOOKUP_EMAIL,
  TEST_CLIENT_LOOKUP_ID,
  type TestingClientSession,
} from '@/mocks/testingClientSession';

/**
 * Path: `admins/{adminId}/clients/{clientId}` — use `collectionGroup(db, 'clients')`
 * to query all tenants. Field is `contactEmail` (case-sensitive); derive `adminId` from path.
 */

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type ClientByEmailHit = {
  clientId: string;
  adminId: string;
  contactEmail: string;
  name: string | null;
};

/** Single client by `contactEmail` — requires collection group index on `contactEmail`. */
export async function getClientByEmailOnly(contactEmail: string): Promise<ClientByEmailHit | null> {
  const email = contactEmail.trim();

  const q = query(collectionGroup(db, 'clients'), where('contactEmail', '==', email), limit(1));

  const snap = await getDocs(q);
  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  const data = doc.data();

  return {
    clientId: doc.id,
    adminId: doc.ref.parent.parent?.id ?? '',
    contactEmail: readNonEmptyString(data.contactEmail) ?? email,
    name: readNonEmptyString(data.name),
  };
}

export type ClientLookupResult = Pick<
  TestingClientSession,
  'clientId' | 'adminId' | 'contactEmail'
>;

export type ClientFirestoreRecord = {
  clientId: string;
  adminId: string;
  documentPath: string;
  data: Record<string, unknown>;
};

export type ClientEmailSummary = {
  clientId: string;
  adminId: string;
  contactEmail: string;
  name: string | null;
};

/** Name + email only from `admins/{adminId}/clients/{clientId}`. */
export type ClientNameEmail = {
  adminId: string;
  clientId: string;
  name: string | null;
  contactEmail: string | null;
};

export async function getClientByAdminAndClientId(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<ClientNameEmail | null> {
  const ref = doc(db, 'admins', adminId, 'clients', clientId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.log('Client not found at', ref.path);
    return null;
  }

  const data = snap.data();
  const contactEmail = readNonEmptyString(data.contactEmail);
  const name = readNonEmptyString(data.name);

  setTestingClientSession({
    clientId,
    adminId,
    contactEmail: contactEmail ?? '',
  });

  return { adminId, clientId, name, contactEmail };
}

export async function getClientByAdminAndClientIdSafe(
  adminId: string = TEST_CLIENT_LOOKUP_ADMIN_ID,
  clientId: string = TEST_CLIENT_LOOKUP_ID,
): Promise<{ client: ClientNameEmail | null; errorMessage: string | null }> {
  try {
    const client = await getClientByAdminAndClientId(adminId, clientId);
    return { client, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Firestore error';
    console.error('[testing] getClientByAdminAndClientId failed:', error);
    return { client: null, errorMessage: message };
  }
}

function mapDocToClientWithEmail(
  doc: QueryDocumentSnapshot<DocumentData>,
): ClientEmailSummary | null {
  const data = doc.data();
  const contactEmail = readNonEmptyString(data.contactEmail);
  if (!contactEmail) {
    return null;
  }

  return {
    clientId: doc.id,
    adminId: doc.ref.parent.parent?.id ?? '',
    contactEmail,
    name: readNonEmptyString(data.name),
  };
}

function mapClientDoc(doc: QueryDocumentSnapshot<DocumentData>): ClientFirestoreRecord {
  return {
    clientId: doc.id,
    adminId: doc.ref.parent.parent?.id ?? '',
    documentPath: doc.ref.path,
    data: doc.data() as Record<string, unknown>,
  };
}

/**
 * Read-only: all documents in the `clients` collection group (every admin tenant).
 */
export async function fetchAllClients(): Promise<ClientFirestoreRecord[]> {
  const snapshot = await getDocs(collectionGroup(db, 'clients'));
  const records = snapshot.docs.map(mapClientDoc);
  records.sort((a, b) => {
    const byAdmin = a.adminId.localeCompare(b.adminId);
    if (byAdmin !== 0) {
      return byAdmin;
    }
    return a.clientId.localeCompare(b.clientId);
  });
  return records;
}

export type FetchAllClientsResult = {
  records: ClientFirestoreRecord[];
  errorMessage: string | null;
};

export type FirebaseConnectionStatus = {
  connected: boolean;
  message: string;
};

/** Lightweight read to verify the app can reach Firestore (no data changes). */
export async function checkFirebaseConnection(): Promise<FirebaseConnectionStatus> {
  try {
    await getDocs(query(collectionGroup(db, 'clients'), limit(1)));
    return { connected: true, message: 'Firebase connected successfully' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return {
      connected: false,
      message: `Firebase not connected: ${detail}`,
    };
  }
}

/** Full collection-group scan — only clients with non-empty `contactEmail` in DB. */
export async function getAllClientEmails(): Promise<ClientEmailSummary[]> {
  const snapshot = await getDocs(collectionGroup(db, 'clients'));

  const clients = snapshot.docs
    .map(mapDocToClientWithEmail)
    .filter((row): row is ClientEmailSummary => row !== null);

  clients.sort((a, b) => a.contactEmail.localeCompare(b.contactEmail));

  return clients;
}

export type GetAllClientEmailsResult = {
  clients: ClientEmailSummary[];
  errorMessage: string | null;
};

export async function getAllClientEmailsSafe(): Promise<GetAllClientEmailsResult> {
  try {
    const clients = await getAllClientEmails();
    return { clients, errorMessage: null };
  } catch (error) {
    console.error('Failed to load client emails:', error);
    const message = error instanceof Error ? error.message : 'Unknown Firestore error';
    return { clients: [], errorMessage: message };
  }
}

/** Read-only: all document ids in the `clients` collection group. */
export async function getAllClientIds(): Promise<string[]> {
  const snapshot = await getDocs(collectionGroup(db, 'clients'));
  const clientIds = snapshot.docs.map((doc) => doc.id).sort((a, b) => a.localeCompare(b));
  console.log('All client IDs:', clientIds);
  return clientIds;
}

export type GetAllClientIdsResult = {
  clientIds: string[];
  errorMessage: string | null;
};

export async function getAllClientIdsSafe(): Promise<GetAllClientIdsResult> {
  try {
    const clientIds = await getAllClientIds();
    return { clientIds, errorMessage: null };
  } catch (error) {
    console.error('Failed to load client IDs:', error);
    const message = error instanceof Error ? error.message : 'Unknown Firestore error';
    return { clientIds: [], errorMessage: message };
  }
}

export async function fetchAllClientsSafe(): Promise<FetchAllClientsResult> {
  try {
    const records = await fetchAllClients();
    return { records, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Firestore error';
    console.error('[testingClientSession] fetchAllClients failed:', error);
    return { records: [], errorMessage: message };
  }
}

export { getClientTrips, type ClientTripSummary } from './getClientTrips';

/**
 * Read-only: resolve client + admin ids for a CRM email.
 */
export async function testGetClientByEmail(
  contactEmail: string = TEST_CLIENT_LOOKUP_EMAIL,
): Promise<ClientLookupResult | null> {
  try {
    const hit = await getClientByEmailOnly(contactEmail);

    if (!hit) {
      console.log('[testingClientSession] Client not found for', contactEmail);
      return null;
    }

    const result: ClientLookupResult = {
      clientId: hit.clientId,
      adminId: hit.adminId,
      contactEmail: hit.contactEmail,
    };

    setTestingClientSession(result);

    console.log('[testingClientSession] Client ID:', result.clientId);
    console.log('[testingClientSession] Admin ID:', result.adminId);
    console.log('[testingClientSession] name:', hit.name);

    return result;
  } catch (error) {
    console.error('[testingClientSession] Failed to get client:', error);
    return null;
  }
}
