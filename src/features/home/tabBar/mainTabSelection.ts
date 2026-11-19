/**
 * Cross-route main tab selection.
 * Trip detail (stack) can request a tab before `router.replace('/')`.
 */

export type MainTabKey = 'home' | 'trips' | 'messages' | 'profile';

const VALID: ReadonlySet<string> = new Set(['home', 'trips', 'messages', 'profile']);

let pendingTab: MainTabKey | null = null;
const listeners = new Set<(tab: MainTabKey) => void>();

export function isMainTabKey(value: string): value is MainTabKey {
  return VALID.has(value);
}

/** Ask MainTabScreen to show this tab (call before navigating home). */
export function requestMainTab(tab: MainTabKey): void {
  pendingTab = tab;
  for (const listener of listeners) {
    listener(tab);
  }
}

export function takePendingMainTab(): MainTabKey | null {
  const next = pendingTab;
  pendingTab = null;
  return next;
}

export function subscribeMainTabRequest(listener: (tab: MainTabKey) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
