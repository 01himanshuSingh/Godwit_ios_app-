/**
 * Active client display profile — separate from BFF auth tokens in `bffSession`.
 *
 * Auth (SecureStore): access/refresh tokens + clientId for API scope.
 * Profile (AsyncStorage): name/email for Home header & greeting — non-secret UI state.
 *
 * Writers: Testing bootstrap / future magic-link completion.
 * Readers: Home and any feature that needs the signed-in client's display identity.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  setTestingClientSession,
  TEST_CLIENT_LOOKUP_ADMIN_ID,
  TEST_CLIENT_LOOKUP_EMAIL,
  TEST_CLIENT_LOOKUP_ID,
} from '@/mocks/testingClientSession';

const STORAGE_KEY = 'godwit.activeClientProfile.v1';

export type ActiveClientProfile = {
  clientId: string;
  adminId: string;
  /** CRM `clients.name` — person / company display name. */
  name: string;
  contactEmail: string;
  /** ISO timestamp of last write — useful for stale UI / debug. */
  updatedAt: string;
};

type Listener = (profile: ActiveClientProfile | null) => void;

let memoryProfile: ActiveClientProfile | null = null;
let hydratePromise: Promise<ActiveClientProfile | null> | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener(memoryProfile);
  }
}

export function subscribeActiveClientProfile(listener: Listener): () => void {
  listeners.add(listener);
  listener(memoryProfile);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveClientProfileSync(): ActiveClientProfile | null {
  return memoryProfile;
}

/** First character of the person name for avatar (e.g. "Himanshu" → "H"). */
export function getProfileInitial(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
}

/** First token for greeting ("Himanshu Modi" → "Himanshu"). */
export function getProfileFirstName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return 'there';
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function greetingForLocalTime(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function syncTestingMirror(profile: ActiveClientProfile | null): void {
  if (!profile) {
    return;
  }
  setTestingClientSession({
    clientId: profile.clientId,
    adminId: profile.adminId,
    contactEmail: profile.contactEmail,
    name: profile.name,
  });
}

export async function hydrateActiveClientProfile(): Promise<ActiveClientProfile | null> {
  if (hydratePromise) {
    return hydratePromise;
  }

  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        memoryProfile = null;
        notify();
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<ActiveClientProfile>;
      if (
        typeof parsed.clientId !== 'string' ||
        typeof parsed.adminId !== 'string' ||
        typeof parsed.name !== 'string'
      ) {
        memoryProfile = null;
        notify();
        return null;
      }
      memoryProfile = {
        clientId: parsed.clientId,
        adminId: parsed.adminId,
        name: parsed.name,
        contactEmail: typeof parsed.contactEmail === 'string' ? parsed.contactEmail : '',
        updatedAt:
          typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
      syncTestingMirror(memoryProfile);
      notify();
      return memoryProfile;
    } catch (error) {
      console.warn('[activeClientProfile] hydrate failed:', error);
      memoryProfile = null;
      notify();
      return null;
    }
  })();

  return hydratePromise;
}

export async function setActiveClientProfile(
  input: Omit<ActiveClientProfile, 'updatedAt'> & { updatedAt?: string },
): Promise<ActiveClientProfile> {
  const profile: ActiveClientProfile = {
    clientId: input.clientId.trim(),
    adminId: input.adminId.trim(),
    name: input.name.trim(),
    contactEmail: input.contactEmail.trim(),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };

  memoryProfile = profile;
  syncTestingMirror(profile);
  notify();

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('[activeClientProfile] persist failed:', error);
  }

  return profile;
}

export async function clearActiveClientProfile(): Promise<void> {
  memoryProfile = null;
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[activeClientProfile] clear failed:', error);
  }
}

/**
 * Dev seed when nothing is persisted yet — uses the pinned Testing client ids.
 * Name stays empty until Testing (or a Firestore read) fills it.
 */
export function getDevFallbackProfileIds(): Pick<
  ActiveClientProfile,
  'clientId' | 'adminId' | 'contactEmail'
> {
  return {
    clientId: TEST_CLIENT_LOOKUP_ID,
    adminId: TEST_CLIENT_LOOKUP_ADMIN_ID,
    contactEmail: TEST_CLIENT_LOOKUP_EMAIL,
  };
}
