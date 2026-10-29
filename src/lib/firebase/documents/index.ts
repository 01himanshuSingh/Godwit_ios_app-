/**
 * Profile Documents vault — CRM reads.
 *
 * Trips tab:
 *   types → tripDocumentTypes.ts
 *   map   → mapSaleToTripDocument.ts
 *   fetch → getClientTripDocuments.ts
 *           getClientTripDocumentsPage (cursor) → UI infinite query
 *           getClientTripDocuments (full drain) → rare / testing
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
