import { initializeFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

/**
 * Expo Go / React Native: default WebChannel often flakes on cold start
 * ("client is offline"). Auto long-polling is the supported workaround for the JS SDK.
 */
export const db = initializeFirestore(getFirebaseApp(), {
  experimentalAutoDetectLongPolling: true,
});
