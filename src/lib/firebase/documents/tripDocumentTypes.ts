/**
 * Profile → Documents → Trips tab.
 * Source: admins/{adminId}/clients/{clientId}/sales/{saleId}.confirmationDoc
 */

import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export type TripDocumentIconKind = 'stay' | 'flight' | 'tour' | 'file';

export type TripDocumentItem = {
  saleId: string;
  title: string;
  url: string;
  serviceName: string | null;
  travelDateKey: string | null;
  /** Formatted for list meta — e.g. "11 July 2026" */
  travelDateLabel: string | null;
  /**
   * Group heading in UI (destination / trip name).
   * Falls back to "Trips" when CRM has no label.
   */
  groupLabel: string;
  /** STAY / FLIGHT / TOUR from CRM serviceName — null when unknown. */
  badgeLabel: string | null;
  iconKind: TripDocumentIconKind;
  /** PDF / PKPASS when detectable from confirmationDoc URL. */
  formatLabel: string | null;
  /**
   * List meta — date · format from CRM-derived parts only.
   * e.g. "11 July 2026 · PDF"
   */
  metaLine: string | null;
  documentPath: string;
};

/** Opaque Firestore cursor for sales pagination (documentId order). */
export type TripDocumentsPageCursor = QueryDocumentSnapshot<DocumentData> | null;

export type ClientTripDocumentsPage = {
  documents: TripDocumentItem[];
  nextCursor: TripDocumentsPageCursor;
  hasMore: boolean;
};

export type GetClientTripDocumentsResult = {
  documents: TripDocumentItem[];
  errorMessage: string | null;
};
