import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import {
  completeMagicLink,
  isFirebaseMagicLink,
} from '@/auth/services/magicLink/completeMagicLink';

/**
 * Future / Dev Client: when a magic link opens the app, complete Firebase sign-in.
 * Expo Go primarily uses the paste screen; this remains for when Linking delivers a URL.
 */
function isMagicLinkUrl(url: string): boolean {
  if (isFirebaseMagicLink(url)) {
    return true;
  }
  const parsed = Linking.parse(url);
  const path = parsed.path ?? '';
  return (
    path.includes('auth/magic-link') || path.includes('finishSignIn') || url.includes('oobCode')
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

  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  useEffect(() => {
    async function handleUrl(url: string) {
      if (!isMagicLinkUrl(url)) {
        return;
      }
      const resolvedEmail = emailRef.current;
      if (!resolvedEmail) {
        onError?.(new Error('Enter the same email on the sign-in screen before opening the link.'));
        return;
      }
      try {
        await completeMagicLink({ email: resolvedEmail, linkUrl: url });
        onSuccess?.();
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
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
