import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/providers/AuthProvider';
import { getFirebaseApp } from '@/lib/firebase/app';
import { queryClient } from '@/lib/query/queryClient';

// Initialize Firebase (Auth / Functions / Firestore clients) — no reads or writes until you call them.
getFirebaseApp();

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
