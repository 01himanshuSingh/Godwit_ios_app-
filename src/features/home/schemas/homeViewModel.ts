/** Static home screen data — replace with API/session hook later. */

export type HomeTripService = {
  id: string;
  label: string;
  icon: 'private-jet' | 'villa' | 'chauffeur' | 'yacht';
};

/**
 * Home summary card for the client's upcoming bookings (all types),
 * not a single parent itinerary / destination trip.
 */
export type HomeUpcomingTripsSummary = {
  /** Card headline — always about the upcoming-trips bundle. */
  title: string;
  /** Window across upcoming bookings, e.g. "14–21 September". */
  dateSummary: string;
  /** Aggregate party / services, e.g. "4 travelling · 4 services arranged". */
  partySummary: string;
  /** Aggregate stay line — not one named villa destination. */
  stayLabel: string;
  /** Next service across the bundle, e.g. "Private Jet · 07:30". */
  nextServiceLabel: string;
  services: HomeTripService[];
  imageUrl: string;
};

/** @deprecated Use HomeUpcomingTripsSummary — kept as alias during rename. */
export type HomeCurrentTrip = HomeUpcomingTripsSummary;

export type HomeViewModel = {
  familyName: string;
  userName: string;
  greeting: string;
  updatesCount: number;
  upcomingTrips: HomeUpcomingTripsSummary;
  notificationsCount: number;
  profileInitials: string;
};

/** Placeholder image — swap for CDN URL from BFF when wired. */
const UPCOMING_TRIPS_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export const staticHomeViewModel: HomeViewModel = {
  familyName: 'MODI FAMILY',
  userName: 'Ruchir',
  greeting: 'Good afternoon',
  updatesCount: 4,
  notificationsCount: 4,
  profileInitials: 'RM',
  upcomingTrips: {
    title: 'Upcoming trips',
    dateSummary: '14–21 September',
    partySummary: '4 travelling · 4 services arranged',
    stayLabel: 'Stays & experiences across your bookings',
    nextServiceLabel: 'Private Jet · 07:30',
    services: [
      { id: 'jet', label: 'Private jet', icon: 'private-jet' },
      { id: 'villa', label: 'Villa', icon: 'villa' },
      { id: 'chauffeur', label: 'Chauffeur', icon: 'chauffeur' },
      { id: 'yacht', label: 'Yacht', icon: 'yacht' },
    ],
    imageUrl: UPCOMING_TRIPS_PLACEHOLDER_IMAGE,
  },
};
