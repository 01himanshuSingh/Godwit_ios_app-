/**
 * In-memory handoff for the document viewer.
 *
 * Signed Storage URLs contain `&` / `=` query material that corrupts Expo Router
 * search params if passed as `?url=…`. Callers store the payload here and navigate
 * with a short opaque `id` only.
 */

export type DocumentViewerSession = {
  url: string;
  title: string;
  createdAt: number;
};

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map<string, DocumentViewerSession>();

function pruneExpired(now = Date.now()): void {
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

function nextId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Store a document for the viewer; returns the opaque route id. */
export function createDocumentViewerSession(url: string, title: string): string {
  pruneExpired();
  const id = nextId();
  sessions.set(id, {
    url,
    title: title.trim() || 'Document',
    createdAt: Date.now(),
  });
  return id;
}

export function getDocumentViewerSession(id: string): DocumentViewerSession | null {
  if (!id) return null;
  pruneExpired();
  return sessions.get(id) ?? null;
}

export function clearDocumentViewerSession(id: string): void {
  if (!id) return;
  sessions.delete(id);
}
