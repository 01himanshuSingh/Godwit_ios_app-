import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import {
  completeMagicLink,
  isFirebaseMagicLink,
} from '@/auth/services/magicLink/completeMagicLink';
import { getPendingAuth, isPendingAuthFresh } from '@/auth/services/pendingAuthStorage';

/**
 * When the user taps the Firebase sign-in link in email, Android/iOS opens the app
 * with that URL. Complete Firebase Auth + client entitlement without a paste UI.
 */
function isMagicLinkUrl(url: string): boolean {
  if (isFirebaseMagicLink(url)) {
    return true;
  }
  const parsed = Linking.parse(url);
  const path = parsed.path ?? '';
  return (
    path.includes('auth/magic-link') ||
    path.includes('finishSignIn') ||
    path.includes('__/auth') ||
    url.includes('oobCode') ||
    url.includes('mode=signIn')
  );
}

type UseMagicLinkHandlerOptions = {
  email: string | null;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useMagicLinkHandler({
  email,
  onSuccess,
  onError,
}: UseMagicLinkHandlerOptions): void {
  const emailRef = useRef(email);
  const handlingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  useEffect(() => {
    async function resolveEmail(): Promise<string | null> {
      if (emailRef.current) {
        return emailRef.current;
      }
      const fresh = await isPendingAuthFresh();
      if (fresh?.email) {
        return fresh.email;
      }
      const pending = await getPendingAuth();
      return pending?.email ?? null;
    }

    async function handleUrl(url: string) {
      if (!url || !isMagicLinkUrl(url)) {
        return;
      }
      if (handlingUrlRef.current === url) {
        return;
      }
      handlingUrlRef.current = url;

      try {
        const resolvedEmail = await resolveEmail();
        if (!resolvedEmail) {
          onError?.(
            new Error(
              'Open Godwit, enter the same email, request a new link, then tap the email on this phone.',
            ),
          );
          return;
        }
        await completeMagicLink({ email: resolvedEmail, linkUrl: url });
        onSuccess?.();
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      } finally {
        handlingUrlRef.current = null;
      }
    }

    void Linking.getInitialURL().then((initial) => {
      if (initial) {
        void handleUrl(initial);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, [onError, onSuccess]);
}
