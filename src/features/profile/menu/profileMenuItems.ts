/**
 * Profile hub menu — single source of truth for rows + routes.
 * Each `section` maps to `app/profile/[section].tsx` → feature screen.
 */

import type { ComponentProps } from 'react';
import type Feather from '@expo/vector-icons/Feather';

export type ProfileMenuIcon = ComponentProps<typeof Feather>['name'];

export type ProfileMenuSectionId =
  'travellers' | 'payments' | 'documents' | 'notifications' | 'account-access' | 'support';

export type ProfileMenuItemDef = {
  id: ProfileMenuSectionId;
  title: string;
  /** Static subtitle; travellers meta can use live count separately. */
  subtitle: string;
  icon: ProfileMenuIcon;
  /** Expo Router path under /profile/[section] */
  href: `/profile/${ProfileMenuSectionId}`;
};

export type ProfileMenuGroupId = 'travel' | 'billing' | 'account';

export type ProfileMenuGroupDef = {
  id: ProfileMenuGroupId;
  title: string;
  trailing?: string;
  itemIds: Exclude<ProfileMenuSectionId, 'support'>[];
};

export const PROFILE_MENU_ITEMS: readonly ProfileMenuItemDef[] = [
  {
    id: 'travellers',
    title: 'Travellers',
    subtitle: 'Family manifests & VIP profiles',
    icon: 'users',
    href: '/profile/travellers',
  },
  {
    id: 'documents',
    title: 'Documents',
    subtitle: 'Passports, visas & yacht registries',
    icon: 'folder',
    href: '/profile/documents',
  },
  {
    id: 'payments',
    title: 'Payments',
    subtitle: 'Private accounts & retainer ledger',
    icon: 'credit-card',
    href: '/profile/payments',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Flight alerts, charter updates, alerts',
    icon: 'bell',
    href: '/profile/notifications',
  },
  {
    id: 'account-access',
    title: 'Account access',
    subtitle: 'Executive assistants & delegate rights',
    icon: 'user-check',
    href: '/profile/account-access',
  },
  {
    id: 'support',
    title: 'Godwit Support',
    subtitle: 'Private desk direct dispatch. Average response under 90 seconds.',
    icon: 'headphones',
    href: '/profile/support',
  },
] as const;

/** Hub layout groups — support is a featured card, not a list row. */
export const PROFILE_MENU_GROUPS: readonly ProfileMenuGroupDef[] = [
  {
    id: 'travel',
    title: 'TRAVEL',
    trailing: 'CONCIERGE ACTIVE',
    itemIds: ['travellers', 'documents'],
  },
  {
    id: 'billing',
    title: 'BILLING',
    trailing: 'SWISS CREDIT FACILITY',
    itemIds: ['payments'],
  },
  {
    id: 'account',
    title: 'ACCOUNT',
    itemIds: ['notifications', 'account-access'],
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
