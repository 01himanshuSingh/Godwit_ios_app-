import type { DocumentData } from 'firebase/firestore';

import type { Airline } from '@/lib/firebase/masterData/airlineTypes';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readCabinClasses(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item.trim());
      continue;
    }
    if (item && typeof item === 'object') {
      const label =
        readString((item as { label?: unknown }).label) ||
        readString((item as { name?: unknown }).name) ||
        readString((item as { id?: unknown }).id);
      if (label) out.push(label);
    }
  }
  return out;
}

export function airlineLabel(code: string, name: string): string {
  if (code && name) return `${code} — ${name}`;
  return name || code;
}

export function airlineMonogram(code: string, name: string): string {
  if (code) return code.slice(0, 3).toUpperCase();
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  if (!cleaned) return '—';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/**
 * Map CRM airline doc. Inactive when `status === false` (CRM contract).
 */
export function mapAirlineDoc(airlineId: string, data: DocumentData): Airline | null {
  const code = readString(data.code) || readString(data.iata) || readString(data.iataCode);
  const name =
    readString(data.name) ||
    readString(data.airlineName) ||
    readString(data.label) ||
    readString(data.title);
  if (!code && !name) return null;

  const isActive =
    data.status === false ||
    data.status === 'inactive' ||
    data.active === false ||
    data.isActive === false
      ? false
      : true;

  return {
    airlineId,
    code,
    name: name || code,
    label: airlineLabel(code, name || code),
    monogram: airlineMonogram(code, name || code),
    cabinClasses: readCabinClasses(data.cabinClasses),
    isActive,
  };
}
