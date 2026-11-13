import type { DocumentData } from 'firebase/firestore';

import type { HotelBrand } from '@/lib/firebase/masterData/hotelBrandTypes';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Build a short monogram for chips (AM, FS, …). */
export function hotelBrandMonogram(name: string, explicit?: string): string {
  const fromCrm = (explicit || '').trim();
  if (fromCrm) return fromCrm.slice(0, 3).toUpperCase();

  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  if (!cleaned) return '—';

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function mapHotelBrandDoc(brandId: string, data: DocumentData): HotelBrand | null {
  const name =
    readString(data.name) ||
    readString(data.brandName) ||
    readString(data.label) ||
    readString(data.title);
  if (!name) return null;

  const isActive =
    data.isActive === false || data.active === false || data.status === 'inactive' ? false : true;

  return {
    brandId,
    name,
    monogram: hotelBrandMonogram(
      name,
      readString(data.monogram) || readString(data.code) || readString(data.abbr),
    ),
    isActive,
  };
}
