import { getFunctions, httpsCallable, type HttpsCallable } from 'firebase/functions';

import { getFirebaseApp } from './app';

const region = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? 'us-central1';

const functions = getFunctions(getFirebaseApp(), region);

export const callFn = <RequestData = unknown, ResponseData = unknown>(
  name: string,
): HttpsCallable<RequestData, ResponseData> => httpsCallable(functions, name);
