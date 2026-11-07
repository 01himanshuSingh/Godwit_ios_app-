/**
 * Survives Expo Go reload / iOS kill while waiting for a magic-link paste.
 * Cleared on successful sign-in, logout, "different email", or expiry.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_KEY = 'pending_auth_email';
const SENT_AT_KEY = 'pending_auth_sent_at';
const RESEND_COOLDOWN_KEY = 'resend_cooldown_until';

/** Align with typical Firebase email-link lifetime (~1 hour). */
export const PENDING_AUTH_TTL_MS = 60 * 60 * 1000;

export type PendingAuth = {
  email: string;
  sentAt: number;
};

export async function savePendingAuth(email: string): Promise<PendingAuth> {
  const normalized = email.trim().toLowerCase();
  const sentAt = Date.now();
  await AsyncStorage.multiSet([
    [EMAIL_KEY, normalized],
    [SENT_AT_KEY, String(sentAt)],
  ]);
  return { email: normalized, sentAt };
}

export async function getPendingAuth(): Promise<PendingAuth | null> {
  const [[, email], [, sentAtRaw]] = await AsyncStorage.multiGet([EMAIL_KEY, SENT_AT_KEY]);
  if (!email?.trim()) {
    return null;
  }
  const sentAt = Number(sentAtRaw || 0);
  return { email: email.trim().toLowerCase(), sentAt: Number.isFinite(sentAt) ? sentAt : 0 };
}

export async function isPendingAuthFresh(now: number = Date.now()): Promise<PendingAuth | null> {
  const pending = await getPendingAuth();
  if (!pending) {
    return null;
  }
  if (!pending.sentAt || now - pending.sentAt >= PENDING_AUTH_TTL_MS) {
    await clearPendingAuth();
    return null;
  }
  return pending;
}

export async function clearPendingAuth(): Promise<void> {
  await AsyncStorage.multiRemove([EMAIL_KEY, SENT_AT_KEY, RESEND_COOLDOWN_KEY]);
}
