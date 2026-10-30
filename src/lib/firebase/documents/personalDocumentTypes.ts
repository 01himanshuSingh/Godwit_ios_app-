/**
 * Profile → Documents → Personal tab.
 * Source: travellers linked to client → customerProfile passports / visas / memberships
 * Fields with Storage URL: docUrl (documentUrl / fileUrl fallbacks)
 */

export type PersonalDocType = 'passport' | 'visa' | 'membership';

export type PersonalDocumentItem = {
  /** Stable list key — customerId + type + index/source */
  id: string;
  kind: 'personal';
  type: PersonalDocType;
  title: string;
  url: string;
  travellerName: string;
  customerId: string;
  /** Fixed CRM label shown under meta when present */
  label: string;
  /** Sort / compare key (ISO or YYYY-MM-DD when known) */
  dateKey: string | null;
  /** e.g. "4 June 2025" */
  dateLabel: string | null;
  /** e.g. "1.2 MB" when CRM exposes size */
  fileSizeLabel: string | null;
  /**
   * List meta line — "4 June 2025 · 1.2 MB" or whichever parts exist.
   */
  metaLine: string | null;
  documentPath: string;
};

/** Opaque cursor: next traveller offset in the sorted client travellers list. */
export type PersonalDocumentsPageCursor = number | null;

export type ClientPersonalDocumentsPage = {
  documents: PersonalDocumentItem[];
  nextCursor: PersonalDocumentsPageCursor;
  hasMore: boolean;
};

export type GetClientPersonalDocumentsResult = {
  documents: PersonalDocumentItem[];
  errorMessage: string | null;
};
