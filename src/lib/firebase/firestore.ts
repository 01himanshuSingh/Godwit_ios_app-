import { getFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

/** Direct Firestore reads — use sparingly; prefer callable Functions / BFF when possible. */
export const db = getFirestore(getFirebaseApp());
