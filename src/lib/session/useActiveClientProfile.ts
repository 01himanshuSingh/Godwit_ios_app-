import { useEffect, useState } from 'react';

import {
  getActiveClientProfileSync,
  hydrateActiveClientProfile,
  subscribeActiveClientProfile,
  type ActiveClientProfile,
} from '@/lib/session/activeClientProfile';

/**
 * Reactive reader for the active client display profile.
 * Hydrates from AsyncStorage once, then follows in-memory writes (e.g. Testing tab).
 */
export function useActiveClientProfile(): {
  profile: ActiveClientProfile | null;
  isHydrating: boolean;
} {
  const [profile, setProfile] = useState<ActiveClientProfile | null>(getActiveClientProfileSync);
  const [isHydrating, setIsHydrating] = useState(getActiveClientProfileSync() === null);

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveClientProfile().finally(() => {
      if (!cancelled) {
        setIsHydrating(false);
      }
    });

    return subscribeActiveClientProfile((next) => {
      if (!cancelled) {
        setProfile(next);
      }
    });
  }, []);

  return { profile, isHydrating };
}
