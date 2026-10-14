import { useMemo } from 'react';

import { staticHomeViewModel } from '@/features/home/schemas/homeViewModel';
import { getProfileInitial } from '@/lib/session/activeClientProfile';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';

/** Shared GODWIT header props (session initials + static notification count). */
export function useAppHeaderState(): {
  notificationsCount: number;
  profileInitials: string;
  isHydrating: boolean;
} {
  const { profile, isHydrating } = useActiveClientProfile();

  const profileInitials = useMemo(() => {
    if (profile?.name?.trim()) {
      return getProfileInitial(profile.name);
    }
    return staticHomeViewModel.profileInitials;
  }, [profile]);

  return {
    notificationsCount: staticHomeViewModel.notificationsCount,
    profileInitials,
    isHydrating,
  };
}
