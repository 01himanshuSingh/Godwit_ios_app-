/**
 * Travellers linked to a client — view models for Profile → Travellers.
 * Source: admins/{adminId}/customers
 */

import type { DocumentData } from 'firebase/firestore';

export type ClientTraveller = {
  customerId: string;
  name: string;
  email: string | null;
  mobile: string | null;
  clientId: string | null;
  clientIds: string[];
  /** e.g. Principal, Spouse, Son, Daughter */
  relationship: string | null;
  /** e.g. India */
  country: string | null;
  isMinor: boolean;
  /**
   * List row subtitle — "Principal · India" or "Daughter · India · Minor".
   */
  detailLine: string | null;
  raw: DocumentData;
};

export type GetTravellersForClientResult = {
  travellers: ClientTraveller[];
  errorMessage: string | null;
};
