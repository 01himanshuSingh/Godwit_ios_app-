/** Static home screen data — replace with API/session hook later. */
export type HomeCurrentTrip = {
  title?: string;
  destination?: string;
  imageUrl: string;
};

export type HomeViewModel = {
  familyName: string;
  userName: string;
  greeting: string;
  updatesCount: number;
  currentTrip: HomeCurrentTrip;
  notificationsCount: number;
  profileInitials: string;
};

/** Placeholder image — swap for CDN URL from BFF when wired. */
const CURRENT_TRIP_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export const staticHomeViewModel: HomeViewModel = {
  familyName: 'MODI FAMILY',
  userName: 'Ruchir',
  greeting: 'Good afternoon',
  updatesCount: 4,
  notificationsCount: 4,
  profileInitials: 'RM',
  currentTrip: {
    title: 'Amalfi Coast',
    destination: 'Italy',
    imageUrl: CURRENT_TRIP_PLACEHOLDER_IMAGE,
  },
};
