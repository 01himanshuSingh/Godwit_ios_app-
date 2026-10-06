import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import { completeMagicLink } from '@/auth/services/magicLink/completeMagicLink';

const MAGIC_LINK_PATH = 'auth/magic-link';

function isMagicLinkUrl(url: string): boolean {
  const parsed = Linking.parse(url);
  const path = parsed.path ?? '';
  return path.includes(MAGIC_LINK_PATH) || url.includes(MAGIC_LINK_PATH);
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
