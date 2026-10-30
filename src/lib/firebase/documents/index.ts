/**
 * Profile Documents vault — CRM reads.
 *
 * Trips tab:
 *   types → tripDocumentTypes.ts
 *   map   → mapSaleToTripDocument.ts
 *   fetch → getClientTripDocuments.ts
 *           getClientTripDocumentsPage (cursor) → UI infinite query
 *           getClientTripDocuments (full drain) → rare / testing
 *
 * Personal tab:
 *   types → personalDocumentTypes.ts
 *   map   → mapCustomerProfileToPersonalDocs.ts
 *   fetch → getClientPersonalDocuments.ts
 *           getClientPersonalDocumentsPage (traveller offset) → UI infinite query
 *           getClientPersonalDocuments (full drain) → rare / testing
 */

export type {
  TripDocumentItem,
  TripDocumentsPageCursor,
  ClientTripDocumentsPage,
  GetClientTripDocumentsResult,
} from './tripDocumentTypes';

export { mapSaleToTripDocument } from './mapSaleToTripDocument';

export {
  TRIP_DOCS_SALES_PAGE_SIZE,
  getClientTripDocumentsPage,
  getClientTripDocuments,
  getClientTripDocumentsSafe,
} from './getClientTripDocuments';

export type {
  PersonalDocType,
  PersonalDocumentItem,
  PersonalDocumentsPageCursor,
  ClientPersonalDocumentsPage,
  GetClientPersonalDocumentsResult,
} from './personalDocumentTypes';

export { mapCustomerProfileToPersonalDocs } from './mapCustomerProfileToPersonalDocs';

export {
  PERSONAL_DOCS_TRAVELLER_PAGE_SIZE,
  getClientPersonalDocumentsPage,
  getClientPersonalDocuments,
  getClientPersonalDocumentsSafe,
} from './getClientPersonalDocuments';
