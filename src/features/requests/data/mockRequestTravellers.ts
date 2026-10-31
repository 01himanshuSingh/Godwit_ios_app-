/**
 * Placeholder travellers for request forms.
 * Swap for CRM travellers API when ready — keep the same shape.
 */

export type RequestTraveller = {
  id: string;
  name: string;
};

/** Static preview list matching the Hotel request mock. */
export const MOCK_REQUEST_TRAVELLERS: readonly RequestTraveller[] = [
  { id: 'traveller-ruchir', name: 'Ruchir Modi' },
  { id: 'traveller-meera', name: 'Meera Modi' },
  { id: 'traveller-arjun', name: 'Arjun Modi' },
  { id: 'traveller-anaya', name: 'Anaya Modi' },
] as const;
