import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useMagicLinkHandler } from '@/auth/hooks/useMagicLinkHandler';
import { sendMagicLink } from '@/auth/services/magicLink/sendMagicLink';
import { clearStoredSession, getStoredSession, type AuthSession } from '@/lib/firebase/auth';

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  pendingMagicLinkEmail: string | null;
  setPendingMagicLinkEmail: (email: string | null) => void;
  sendMagicLinkEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  magicLinkError: string | null;
  clearMagicLinkError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMagicLinkEmail, setPendingMagicLinkEmail] = useState<string | null>(null);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);

  useEffect(() => {
    void getStoredSession()
      .then(setSession)
      .finally(() => setIsLoading(false));
  }, []);

  useMagicLinkHandler({
    email: pendingMagicLinkEmail,
    onSuccess: () => {
      void getStoredSession().then((next) => {
        setSession(next);
        setPendingMagicLinkEmail(null);
        setMagicLinkError(null);
      });
    },
    onError: (error) => setMagicLinkError(error.message),
  });

  const sendMagicLinkEmail = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    await sendMagicLink({ email: normalized });
    setPendingMagicLinkEmail(normalized);
    setMagicLinkError(null);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredSession();
    setSession(null);
    setPendingMagicLinkEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      pendingMagicLinkEmail,
      setPendingMagicLinkEmail,
      sendMagicLinkEmail,
      signOut,
      magicLinkError,
      clearMagicLinkError: () => setMagicLinkError(null),
    }),
    [session, isLoading, pendingMagicLinkEmail, sendMagicLinkEmail, signOut, magicLinkError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
