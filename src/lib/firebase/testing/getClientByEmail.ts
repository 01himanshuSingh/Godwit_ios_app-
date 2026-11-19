import {
  collection,
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
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';
import { setActiveClientProfile } from '@/lib/session/activeClientProfile';
import type { TestingClientSession } from '@/mocks/testingClientSession';

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

function mapClientDocToHit(
  snapDoc: QueryDocumentSnapshot<DocumentData>,
  fallbackEmail: string,
): ClientByEmailHit {
  const data = snapDoc.data();
  return {
    clientId: snapDoc.id,
    adminId: snapDoc.ref.parent.parent?.id ?? '',
    contactEmail:
      readNonEmptyString(data.contactEmail) || readNonEmptyString(data.email) || fallbackEmail,
    name: readNonEmptyString(data.name),
  };
}

/**
 * Single client from CRM `clients` docs only (not Firebase Auth users).
 * Primary: `contactEmail` (Godwit field). Optional soft fallback: `email`.
 * Missing fallback index must not mask “no client” — return null instead.
 */
export async function getClientByEmailOnly(contactEmail: string): Promise<ClientByEmailHit | null> {
  const email = contactEmail.trim();
  if (!email) return null;

  return withFirestoreRetry('getClientByEmailOnly', async () => {
    const byContact = await getDocs(
      query(collectionGroup(db, 'clients'), where('contactEmail', '==', email), limit(1)),
    );
    if (!byContact.empty) {
      return mapClientDocToHit(byContact.docs[0]!, email);
    }

    // Soft fallback — if `email` index is missing, treat as not found (not a hard failure).
    try {
      const byEmail = await getDocs(
        query(collectionGroup(db, 'clients'), where('email', '==', email), limit(1)),
      );
      if (!byEmail.empty) {
        return mapClientDocToHit(byEmail.docs[0]!, email);
      }
    } catch (error) {
      console.warn('[getClientByEmailOnly] email-field fallback skipped:', error);
    }

    return null;
  });
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
  adminId: string,
  clientId: string,
): Promise<ClientNameEmail | null> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  if (!aid || !cid) {
    throw new Error('adminId and clientId are required');
  }

  return withFirestoreRetry('getClientByAdminAndClientId', async () => {
    const ref = doc(db, 'admins', aid, 'clients', cid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log('Client not found at', ref.path);
      return null;
    }

    const data = snap.data();
    const contactEmail = readNonEmptyString(data.contactEmail);
    const name = readNonEmptyString(data.name);

    await setActiveClientProfile({
      clientId: cid,
      adminId: aid,
      name: name ?? '',
      contactEmail: contactEmail ?? '',
    });

    return { adminId: aid, clientId: cid, name, contactEmail };
  });
}

export async function getClientByAdminAndClientIdSafe(
  adminId: string,
  clientId: string,
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

export type GetAllClientEmailsResult = {
  clients: ClientEmailSummary[];
  errorMessage: string | null;
};

/** Lightweight read — any admins doc probe (no pinned test client). */
export async function checkFirebaseConnection(): Promise<FirebaseConnectionStatus> {
  try {
    await withFirestoreRetry('checkFirebaseConnection', async () => {
      const snap = await getDocs(query(collection(db, 'admins'), limit(1)));
      void snap;
    });
    return { connected: true, message: 'Firebase connected successfully' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return {
      connected: false,
      message: `Firebase not connected: ${detail}`,
    };
  }
}

/**
 * Clients with email under one admin — path query (much more reliable than
 * full `collectionGroup('clients')` on Expo Go cold start).
 */
export async function getClientEmailsForAdmin(adminId: string): Promise<ClientEmailSummary[]> {
  return withFirestoreRetry('getClientEmailsForAdmin', async () => {
    const snapshot = await getDocs(collection(db, 'admins', adminId, 'clients'));

    const clients = snapshot.docs
      .map(mapDocToClientWithEmail)
      .filter((row): row is ClientEmailSummary => row !== null);

    clients.sort((a, b) => a.contactEmail.localeCompare(b.contactEmail));
    return clients;
  });
}

export async function getClientEmailsForAdminSafe(
  adminId: string,
): Promise<GetAllClientEmailsResult> {
  try {
    const clients = await getClientEmailsForAdmin(adminId);
    return { clients, errorMessage: null };
  } catch (error) {
    console.error('Failed to load admin client emails:', error);
    const message = error instanceof Error ? error.message : 'Unknown Firestore error';
    return { clients: [], errorMessage: message };
  }
}

/** Full collection-group scan — only clients with non-empty `contactEmail` in DB. */
export async function getAllClientEmails(): Promise<ClientEmailSummary[]> {
  return withFirestoreRetry('getAllClientEmails', async () => {
    const snapshot = await getDocs(collectionGroup(db, 'clients'));

    const clients = snapshot.docs
      .map(mapDocToClientWithEmail)
      .filter((row): row is ClientEmailSummary => row !== null);

    clients.sort((a, b) => a.contactEmail.localeCompare(b.contactEmail));

    return clients;
  });
}

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
  contactEmail: string,
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

    await setActiveClientProfile({
      clientId: result.clientId,
      adminId: result.adminId,
      name: hit.name ?? '',
      contactEmail: result.contactEmail,
    });

    console.log('[testingClientSession] Client ID:', result.clientId);
    console.log('[testingClientSession] Admin ID:', result.adminId);
    console.log('[testingClientSession] name:', hit.name);

    return result;
  } catch (error) {
    console.error('[testingClientSession] Failed to get client:', error);
    return null;
  }
}
