/**
 * Pure mapper: client Firestore doc → Profile Account UI model.
 * No I/O — unit-testable. Fetch lives in `getClientProfile.ts`.
 *
 * Path: admins/{adminId}/clients/{clientId}
 *
 * Field contract (CRM → UI):
 *   ACCOUNT name   ← name | fullName | clientName
 *   Email          ← contactEmail | email
 *   Role           ← accountRole | role | `Principal - {Family}`
 *   Director name  ← relationshipManagerName | directorName | relationshipManager.name
 *   Director title ← directorTitle | default "Private Travel Director"
 */

import type { DocumentData } from 'firebase/firestore';

import type { ClientProfileView } from '@/lib/firebase/clients/clientProfileTypes';

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

function pickFirst(data: DocumentData, keys: string[]): string | null {
  for (const key of keys) {
    const v = readString(data[key]);
    if (v) return v;
  }
  return null;
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Hero / Profile family eyebrow from client display name.
 *   "Ruchir Modi"  → "Modi Family"   (surname present)
 *   "Modi Family"  → "Modi Family"   (already family-labelled)
 *   "Himanshu"     → "Himanshu"      (single name — no "Family" suffix)
 */
export function familyLabelFromClientName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return 'Family';
  }

  const normalized = trimmed.replace(/\s+/g, ' ');

  if (/\bfamily\b/i.test(normalized)) {
    return titleCaseWords(normalized);
  }

  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length < 2) {
    return titleCaseWords(parts[0] ?? normalized);
  }

  const surname = parts[parts.length - 1] ?? normalized;
  return `${titleCaseWords(surname)} Family`;
}

function mapDirector(data: DocumentData): { name: string | null; title: string | null } {
  const relationshipManager = asRecord(data.relationshipManager);

  const name =
    pickFirst(data, ['relationshipManagerName', 'directorName']) ||
    (relationshipManager
      ? pickFirst(relationshipManager, ['name', 'fullName', 'displayName'])
      : null);

  const title = pickFirst(data, ['directorTitle']) || (name ? 'Private Travel Director' : null);

  return { name, title };
}

function mapAccountRole(data: DocumentData, familyLabel: string): string | null {
  const explicit = pickFirst(data, ['accountRole', 'role']);
  if (explicit) {
    if (/\bfamily\b/i.test(explicit) || explicit.includes('-')) {
      return explicit;
    }
    return `${explicit} - ${familyLabel}`;
  }
  return `Principal - ${familyLabel}`;
}

export type MapClientProfileOpts = {
  adminId: string;
  clientId: string;
  documentPath: string;
  /** Optional — filled by fetch layer after count query. */
  travellerCount?: number | null;
};

/**
 * Map one client document into the Profile Account card view model.
 */
export function mapClientDocToProfileView(
  data: DocumentData,
  opts: MapClientProfileOpts,
): ClientProfileView {
  const displayName = pickFirst(data, ['name', 'fullName', 'clientName']) ?? '';
  const contactEmail = pickFirst(data, ['contactEmail', 'email']);
  const familyLabel = familyLabelFromClientName(displayName);
  const director = mapDirector(data);

  return {
    adminId: opts.adminId,
    clientId: opts.clientId,
    documentPath: opts.documentPath,
    displayName,
    contactEmail,
    familyLabel,
    accountRole: mapAccountRole(data, familyLabel),
    directorName: director.name,
    directorTitle: director.title,
    travellerCount: opts.travellerCount ?? null,
  };
}
