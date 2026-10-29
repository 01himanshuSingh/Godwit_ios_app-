/**
 * Profile hub menu — single source of truth for rows + routes.
 * Each `section` maps to `app/profile/[section].tsx` → feature screen.
 */

import type { ComponentProps } from 'react';
import type Feather from '@expo/vector-icons/Feather';

export type ProfileMenuIcon = ComponentProps<typeof Feather>['name'];

export type ProfileMenuSectionId =
  | 'travellers'
  | 'payments'
  | 'documents'
  | 'notifications'
  | 'account-access'
  | 'security'
  | 'support';

export type ProfileMenuItemDef = {
  id: ProfileMenuSectionId;
  title: string;
  /** Static subtitle; travellers can be overridden with a live count. */
  subtitle: string;
  icon: ProfileMenuIcon;
  /** Expo Router path under /profile/[section] */
  href: `/profile/${ProfileMenuSectionId}`;
};

export const PROFILE_MENU_ITEMS: readonly ProfileMenuItemDef[] = [
  {
    id: 'travellers',
    title: 'Travellers',
    subtitle: 'Details, documents, loyalty, preferences',
    icon: 'users',
    href: '/profile/travellers',
  },
  {
    id: 'payments',
    title: 'Payments',
    subtitle: 'Invoices, payments received and statement',
    icon: 'credit-card',
    href: '/profile/payments',
  },
  {
    id: 'documents',
    title: 'Documents',
    subtitle: 'Vouchers, tickets and travel documents',
    icon: 'file-text',
    href: '/profile/documents',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'What your Godwit team has sent you',
    icon: 'bell',
    href: '/profile/notifications',
  },
  {
    id: 'account-access',
    title: 'Account access',
    subtitle: 'Who may use this Godwit account',
    icon: 'key',
    href: '/profile/account-access',
  },
  {
    id: 'security',
    title: 'Security',
    subtitle: 'Sign-in, devices and sessions',
    icon: 'shield',
    href: '/profile/security',
  },
  {
    id: 'support',
    title: 'Godwit support',
    subtitle: 'Your travel team, available 24/7',
    icon: 'help-circle',
    href: '/profile/support',
  },
] as const;

export function isProfileMenuSectionId(value: string): value is ProfileMenuSectionId {
  return PROFILE_MENU_ITEMS.some((item) => item.id === value);
}

export function getProfileMenuItem(id: ProfileMenuSectionId): ProfileMenuItemDef {
  const found = PROFILE_MENU_ITEMS.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown profile menu section: ${id}`);
  }
  return found;
}
