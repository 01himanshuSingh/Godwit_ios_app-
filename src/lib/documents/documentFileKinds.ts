/**
 * Infer document kind / MIME from a Storage / HTTPS URL path.
 */

export type DocumentFileKind = 'pdf' | 'image' | 'pkpass' | 'other';

function urlPath(url: string): string {
  return url.trim().split('?')[0]?.toLowerCase() ?? '';
}

export function documentFileKindFromUrl(url: string): DocumentFileKind {
  const path = urlPath(url);
  if (path.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|gif|webp|heic)$/.test(path)) return 'image';
  if (path.endsWith('.pkpass')) return 'pkpass';
  return 'other';
}

/** Prefer extension from the URL path; fall back by kind. */
export function documentFileExtensionFromUrl(url: string, kind: DocumentFileKind): string {
  const path = urlPath(url);
  const match = path.match(/\.([a-z0-9]+)$/i);
  if (match?.[1]) {
    const ext = match[1].toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    return ext.slice(0, 8);
  }
  return documentFileExtension(kind);
}

export function documentFileExtension(kind: DocumentFileKind): string {
  switch (kind) {
    case 'pdf':
      return 'pdf';
    case 'image':
      return 'jpg';
    case 'pkpass':
      return 'pkpass';
    default:
      return 'bin';
  }
}

export function documentMimeType(kind: DocumentFileKind, url?: string): string {
  if (kind === 'image' && url) {
    const path = urlPath(url);
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.gif')) return 'image/gif';
    if (path.endsWith('.webp')) return 'image/webp';
    if (path.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }

  switch (kind) {
    case 'pdf':
      return 'application/pdf';
    case 'image':
      return 'image/jpeg';
    case 'pkpass':
      return 'application/vnd.apple.pkpass';
    default:
      return 'application/octet-stream';
  }
}

export function documentUti(kind: DocumentFileKind): string | undefined {
  switch (kind) {
    case 'pdf':
      return 'com.adobe.pdf';
    case 'image':
      return 'public.image';
    case 'pkpass':
      return 'com.apple.pkpass';
    default:
      return undefined;
  }
}
