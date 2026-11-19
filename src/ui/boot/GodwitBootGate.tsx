/**
 * App cold-start gate: keep brand splash up through fonts + auth hydrate,
 * with a short minimum dwell so the bird moment is visible.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/auth/providers/AuthProvider';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { GodwitBootSplash } from '@/ui/boot/GodwitBootSplash';
import { useGodwitFonts } from '@/ui/fonts/useGodwitFonts';

/** Minimum time the brand splash stays visible (ms). */
const MIN_BOOT_MS = 1400;

type GodwitBootGateProps = {
  children: ReactNode;
};

export function GodwitBootGate({ children }: GodwitBootGateProps) {
  const fontsLoaded = useGodwitFonts();
  const { isLoading: authLoading } = useAuth();
  const { isHydrating } = useActiveClientProfile();

  const [minDwellDone, setMinDwellDone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMinDwellDone(true), MIN_BOOT_MS);
    return () => clearTimeout(t);
  }, []);

  const systemsReady = fontsLoaded && !authLoading && !isHydrating;
  const canExit = systemsReady && minDwellDone;

  // Begin exit as soon as systems + minimum brand dwell are ready.
  if (canExit && visible && !exiting) {
    setExiting(true);
  }

  const handleExited = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      {children}
      {visible ? (
        <GodwitBootSplash mode="lockup" exiting={exiting} onExited={handleExited} />
      ) : null}
    </>
  );
}
