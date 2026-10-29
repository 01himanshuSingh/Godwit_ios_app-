/**
 * Client CRM reads for Profile hub (and shared identity).
 *
 * Path: admins/{adminId}/clients/{clientId}
 *
 * Layering (same idea as sales/*Services):
 *   types  → clientProfileTypes.ts
 *   map    → mapClientProfile.ts   (pure)
 *   fetch  → getClientProfile.ts   (Firestore + session sync)
 */

export type { ClientProfileView, GetClientProfileResult } from './clientProfileTypes';

export { familyLabelFromClientName, mapClientDocToProfileView } from './mapClientProfile';

export { getClientProfile, getClientProfileSafe } from './getClientProfile';
