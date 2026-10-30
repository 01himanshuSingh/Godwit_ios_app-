/**
 * Traveller Travel Documents card.
 * Source: customerProfile preferences.passports | visas | memberships
 */

export type TravelDocStatus = 'Valid' | 'Renew soon' | 'Expired' | 'Unknown';

export type TravelDocType = 'passport' | 'visa' | 'membership';

export type TravelDocItem = {
  id: string;
  type: TravelDocType;
  /** "Passport" | "Visa" | membership programName */
  title: string;
  /** Visas only — shown on detail line */
  country: string | null;
  /** Memberships only — masked last 4 */
  maskedNumber: string | null;
  /** Detail line under title (country · masked) */
  detailLine: string | null;
  /** Raw expiry key for sort / status */
  expiresAtKey: string | null;
  /** e.g. "Expires 2 November 2029" */
  expiresAtLabel: string | null;
  status: TravelDocStatus;
  docUrl: string | null;
};

export type TravellerTravelDocs = {
  customerId: string;
  items: TravelDocItem[];
  /** e.g. "4 on file · numbers always masked" */
  summaryLine: string;
};

export type GetTravellerTravelDocsResult = {
  travelDocs: TravellerTravelDocs | null;
  errorMessage: string | null;
};
