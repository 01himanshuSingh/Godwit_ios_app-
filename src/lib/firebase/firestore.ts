import { initializeFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

/**
 * Expo Go / React Native: default WebChannel often stalls or reports offline
 * even on a healthy network. Force long-polling and raise the long-poll wait
 * so the first connect is less likely to trip the default ~10s backend timeout.
 */
export const db = initializeFirestore(getFirebaseApp(), {
  experimentalForceLongPolling: true,
  experimentalLongPollingOptions: {
    // Default is shorter; RN cellular / Expo Go benefits from a bit more headroom.
    timeoutSeconds: 25,
  },
});
