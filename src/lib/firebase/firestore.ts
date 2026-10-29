import { initializeFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

/**
 * Expo Go / React Native: default WebChannel often reports
 * "Failed to get document because the client is offline" even when the device
 * has network. Force long-polling — more reliable than auto-detect on RN.
 */
export const db = initializeFirestore(getFirebaseApp(), {
  experimentalForceLongPolling: true,
});
