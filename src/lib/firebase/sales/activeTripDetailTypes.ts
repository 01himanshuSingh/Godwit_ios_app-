import type { DocumentData } from 'firebase/firestore';

import type { SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

export type DetailRow = {
  label: string;
  value: string;
  /** TELEPHONE rows can render a phone icon in the UI. */
  kind?: 'text' | 'phone';
};

export type GodwitBenefit = {
  title: string;
  note: string | null;
};

export type ActiveTripDetailBase = {
  saleId: string;
  adminId: string;
  clientId: string;
  documentPath: string;
  serviceType: SaleServiceType;
  serviceTypeLabel: string;
  title: string;
  subtitle: string | null;
  statusLabel: string;
  confirmationNo: string | null;
  /** e.g. "Confirmation MO-PAR-449120" */
  confirmationBadge: string | null;
  paymentLabel: string | null;
  /** e.g. "Included in your trip" — VIP / chauffeur package badge */
  inclusionBadge: string | null;
  travellerNames: string[];
  detailRows: DetailRow[];
  /** SPECIAL REQUESTS card — hide when empty */
  specialRequests: string[];
  /** CANCELLATION TERMS card — hide when null */
  cancellationTerms: string | null;
  /** YOUR GODWIT BENEFITS card — hide when empty */
  godwitBenefits: GodwitBenefit[];
  showMessageGodwitCta: boolean;
  missingForMockup: string[];
  raw: DocumentData;
};

export type GetActiveTripDetailResult = {
  detail: ActiveTripDetailBase | null;
  errorMessage: string | null;
};
