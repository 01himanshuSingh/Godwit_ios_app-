/**
 * Pure mapper: customerProfile (+ traveller) → PersonalDocumentItem[]
 * Only entries with a Storage URL (docUrl) are included.
 */

import type { DocumentData, Timestamp } from 'firebase/firestore';

import type {
  PersonalDocType,
  PersonalDocumentItem,
} from '@/lib/firebase/documents/personalDocumentTypes';

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length ? t : null;
}

function asRecord(value: unknown): DocumentData {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as DocumentData) : {};
}

function asList(value: unknown): DocumentData[] {
  return Array.isArray(value) ? (value as DocumentData[]) : [];
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof (value as Timestamp)?.toDate === 'function') {
    try {
      const d = (value as Timestamp).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDateLabel(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toDateKey(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFileSizeLabel(value: unknown): string | null {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  const mb = n / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1).replace(/\.0$/, '')} MB`;
}

function readDocUrl(row: DocumentData): string | null {
  return (
    readString(row.docUrl) ||
    readString(row.documentUrl) ||
    readString(row.fileUrl) ||
    readString(row.url) ||
    null
  );
}

function buildMetaLine(dateLabel: string | null, fileSizeLabel: string | null): string | null {
  if (dateLabel && fileSizeLabel) return `${dateLabel} · ${fileSizeLabel}`;
  return dateLabel || fileSizeLabel || null;
}

function pushDoc(
  out: PersonalDocumentItem[],
  args: {
    customerId: string;
    travellerName: string;
    type: PersonalDocType;
    title: string;
    url: string;
    date: Date | null;
    fileSizeLabel: string | null;
    index: number;
    profilePath: string;
  },
): void {
  const dateKey = toDateKey(args.date);
  const dateLabel = formatDateLabel(args.date);
  const id = `${args.customerId}:${args.type}:${args.index}:${args.url.slice(-24)}`;

  out.push({
    id,
    kind: 'personal',
    type: args.type,
    title: args.title,
    url: args.url,
    travellerName: args.travellerName,
    customerId: args.customerId,
    label: 'Personal document',
    dateKey,
    dateLabel,
    fileSizeLabel: args.fileSizeLabel,
    metaLine: buildMetaLine(dateLabel, args.fileSizeLabel),
    documentPath: `${args.profilePath}/${args.type}/${args.index}`,
  });
}

/**
 * Collect passport / visa / membership rows that have a downloadable URL.
 */
export function mapCustomerProfileToPersonalDocs(
  customerId: string,
  travellerName: string,
  profile: DocumentData | null | undefined,
  profilePath: string,
): PersonalDocumentItem[] {
  if (!profile) return [];

  const name = travellerName.trim() || 'Traveller';
  const prefs = asRecord(profile.preferences);
  const out: PersonalDocumentItem[] = [];

  const seenUrls = new Set<string>();

  const passports = mergeUniqueRows(asList(profile.passports), asList(prefs.passports));
  passports.forEach((p, index) => {
    const url = readDocUrl(p);
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    const date =
      toDate(p.expiryEnd) || toDate(p.expiryDate) || toDate(p.issueDate) || toDate(p.issuedAt);
    pushDoc(out, {
      customerId,
      travellerName: name,
      type: 'passport',
      title: `Passport scan — ${name}`,
      url,
      date,
      fileSizeLabel: formatFileSizeLabel(p.fileSize ?? p.sizeBytes ?? p.size),
      index,
      profilePath,
    });
  });

  const visas = mergeUniqueRows(asList(profile.visas), asList(prefs.visas));
  visas.forEach((v, index) => {
    const url = readDocUrl(v);
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    const country = readString(v.country) || readString(v.countryName);
    const countryPart = country ? ` (${country})` : '';
    const date =
      toDate(v.expiryEnd) || toDate(v.expiryDate) || toDate(v.issueDate) || toDate(v.issuedAt);
    pushDoc(out, {
      customerId,
      travellerName: name,
      type: 'visa',
      title: `Visa${countryPart} — ${name}`,
      url,
      date,
      fileSizeLabel: formatFileSizeLabel(v.fileSize ?? v.sizeBytes ?? v.size),
      index,
      profilePath,
    });
  });

  const memberships = mergeUniqueRows(asList(prefs.memberships), asList(profile.memberships));
  memberships.forEach((m, index) => {
    const url = readDocUrl(m);
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    const program =
      readString(m.programName) ||
      readString(m.name) ||
      readString(m.programme) ||
      readString(m.program) ||
      'Membership';
    const date = toDate(m.expiryDate) || toDate(m.expiry) || toDate(m.expiresAt);
    pushDoc(out, {
      customerId,
      travellerName: name,
      type: 'membership',
      title: `${program} — ${name}`,
      url,
      date,
      fileSizeLabel: formatFileSizeLabel(m.fileSize ?? m.sizeBytes ?? m.size),
      index,
      profilePath,
    });
  });

  return out;
}

/** Prefer first list order; skip duplicate object references from prefs mirror. */
function mergeUniqueRows(primary: DocumentData[], secondary: DocumentData[]): DocumentData[] {
  const out: DocumentData[] = [];
  const seen = new Set<DocumentData>();
  for (const row of [...primary, ...secondary]) {
    if (seen.has(row)) continue;
    seen.add(row);
    out.push(row);
  }
  return out;
}
