/**
 * CRM masterData/airlines/items — catalog for Preferred airline.
 */

export type Airline = {
  airlineId: string;
  code: string;
  name: string;
  /** Display: `BA — British Airways` when both present. */
  label: string;
  /** Chip / mono badge (usually IATA code). */
  monogram: string;
  cabinClasses: string[];
  isActive: boolean;
};

export type AirlinesPageCursor = import('firebase/firestore').QueryDocumentSnapshot | null;

export type AirlinesPage = {
  airlines: Airline[];
  nextCursor: AirlinesPageCursor;
  hasMore: boolean;
};
