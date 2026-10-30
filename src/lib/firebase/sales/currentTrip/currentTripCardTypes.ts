/**
 * Home trip spotlight card — current in-window cluster, else next upcoming.
 */

import type { SaleServiceType } from '@/lib/firebase/sales/getClientUpcomingSales';

/** Which window the card represents (drives section label + date copy). */
export type HomeTripCardMode = 'current' | 'upcoming';

export type CurrentTripServiceIcon =
  'private-jet' | 'villa' | 'chauffeur' | 'yacht' | 'flight' | 'vip' | 'experience' | 'other';

export type CurrentTripServiceChip = {
  id: string;
  label: string;
  icon: CurrentTripServiceIcon;
  serviceType: SaleServiceType;
};

export type CurrentTripNextUp = {
  saleId: string;
  label: string;
  time: string | null;
  /** "Private jet · 07:30" */
  displayLabel: string;
};

/** UI view model for Home CurrentTripCard (current or upcoming spotlight). */
export type ClientCurrentTripCard = {
  /** current = in-window; upcoming = soonest future cluster */
  mode: HomeTripCardMode;
  /** e.g. YOUR CURRENT TRIP / YOUR UPCOMING TRIP */
  sectionLabel: string;
  primarySaleId: string;
  saleIds: string[];
  title: string;
  placeLine: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  dayIndex: number | null;
  dayLabel: string | null;
  /** e.g. "14–21 September · 7 nights · Day 8 of 7" */
  dateSummary: string;
  travellerCount: number;
  servicesCount: number;
  /** e.g. "4 travelling · 4 services arranged" */
  partySummary: string;
  serviceTypes: SaleServiceType[];
  services: CurrentTripServiceChip[];
  nextUp: CurrentTripNextUp | null;
  /** Placeholder cover — CRM has no trip image field */
  coverUrl: string;
};

export type GetClientCurrentTripCardResult = {
  card: ClientCurrentTripCard | null;
  errorMessage: string | null;
};
