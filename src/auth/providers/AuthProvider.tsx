import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useMagicLinkHandler } from '@/auth/hooks/useMagicLinkHandler';
import {
  completeMagicLink,
  establishClientSessionFromUser,
} from '@/auth/services/magicLink/completeMagicLink';
import { sendMagicLink } from '@/auth/services/magicLink/sendMagicLink';
import {
  clearPendingAuth,
  getPendingAuth,
  isPendingAuthFresh,
  type PendingAuth,
} from '@/auth/services/pendingAuthStorage';
import { signInWithClientEmail } from '@/auth/services/testing/signInWithClientEmail';
import { signOutFirebaseUser, subscribeFirebaseAuthState } from '@/lib/firebase/firebaseAuth';
import {
  clearActiveClientProfile,
  hydrateActiveClientProfile,
} from '@/lib/session/activeClientProfile';
import { clearStoredSession, getStoredSession, type AuthSession } from '@/lib/session/bffSession';

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  /** Fresh pending magic-link wait state (survives Expo Go reload). */
  pendingAuth: PendingAuth | null;
  pendingMagicLinkEmail: string | null;
  setPendingMagicLinkEmail: (email: string | null) => void;
  sendMagicLinkEmail: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (linkUrl: string) => Promise<void>;
  clearPendingMagicLink: () => Promise<void>;
  /** Legacy testing path — CRM email lookup without Firebase Auth. */
  signInWithTestingEmail: (email: string) => Promise<void>;
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
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const [pendingMagicLinkEmail, setPendingMagicLinkEmail] = useState<string | null>(null);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeFirebaseAuthState((user) => {
      void (async () => {
        try {
          await hydrateActiveClientProfile();
          const freshPending = await isPendingAuthFresh();
          if (!cancelled) {
            setPendingAuth(freshPending);
            setPendingMagicLinkEmail(freshPending?.email ?? null);
          }

          if (user) {
            try {
              const result = await establishClientSessionFromUser(user);
              if (!cancelled) {
                setSession(result.session);
                setPendingAuth(null);
                setPendingMagicLinkEmail(null);
                setMagicLinkError(null);
              }
            } catch (error) {
              await clearStoredSession();
              await clearActiveClientProfile();
              if (!cancelled) {
                setSession(null);
                setMagicLinkError(error instanceof Error ? error.message : String(error));
              }
            }
            return;
          }

          // No Firebase user — do not restore stub SecureStore sessions as "signed in".
          await clearStoredSession();
          await clearActiveClientProfile();
          if (!cancelled) {
            setSession(null);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useMagicLinkHandler({
    email: pendingMagicLinkEmail,
    onSuccess: () => {
      void getStoredSession().then((next) => {
        setSession(next);
        setPendingMagicLinkEmail(null);
        setPendingAuth(null);
        setMagicLinkError(null);
      });
    },
    onError: (error) => setMagicLinkError(error.message),
  });

  const sendMagicLinkEmail = useCallback(async (email: string) => {
    const result = await sendMagicLink({ email });
    const pending = await getPendingAuth();
    setPendingAuth(pending);
    setPendingMagicLinkEmail(result.email);
    setMagicLinkError(null);
  }, []);

  const completeMagicLinkSignIn = useCallback(
    async (linkUrl: string) => {
      const pending = (await isPendingAuthFresh()) ?? (await getPendingAuth());
      const email = pending?.email ?? pendingMagicLinkEmail;
      if (!email) {
        throw new Error('Please enter your email again.');
      }

      try {
        const result = await completeMagicLink({ email, linkUrl });
        setSession(result.session);
        setPendingAuth(null);
        setPendingMagicLinkEmail(null);
        setMagicLinkError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/expired|already used|Request a new link/i.test(message)) {
          await clearPendingAuth();
          setPendingAuth(null);
          setPendingMagicLinkEmail(null);
        }
        setMagicLinkError(message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [pendingMagicLinkEmail],
  );

  const clearPendingMagicLink = useCallback(async () => {
    await clearPendingAuth();
    setPendingAuth(null);
    setPendingMagicLinkEmail(null);
    setMagicLinkError(null);
  }, []);

  const signInWithTestingEmail = useCallback(async (email: string) => {
    const result = await signInWithClientEmail(email);
    setSession(result.session);
    setMagicLinkError(null);
    setPendingMagicLinkEmail(null);
    setPendingAuth(null);
    await clearPendingAuth();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutFirebaseUser();
    } catch {
      // ignore — still clear local state
    }
    await Promise.all([clearStoredSession(), clearActiveClientProfile(), clearPendingAuth()]);
    setSession(null);
    setPendingAuth(null);
    setPendingMagicLinkEmail(null);
    setMagicLinkError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      pendingAuth,
      pendingMagicLinkEmail,
      setPendingMagicLinkEmail,
      sendMagicLinkEmail,
      completeMagicLinkSignIn,
      clearPendingMagicLink,
      signInWithTestingEmail,
      signOut,
      magicLinkError,
      clearMagicLinkError: () => setMagicLinkError(null),
    }),
    [
      session,
      isLoading,
      pendingAuth,
      pendingMagicLinkEmail,
      sendMagicLinkEmail,
      completeMagicLinkSignIn,
      clearPendingMagicLink,
      signInWithTestingEmail,
      signOut,
      magicLinkError,
    ],
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
