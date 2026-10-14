/**
 * "Your Godwit benefits" for Hotel Active Detail.
 *
 * Instant Sale only stamps preferredPartnershipId — benefit text lives on:
 *   admins/{adminId}/preferredPartnerships/{preferredPartnershipId}
 *
 * Resolve order:
 * 1) linkedSuppliers[].standardBenefits (match hotelBrandId / hotel name)
 * 2) partnership.standardBenefits
 * 3) legacy sale form godwitBenefits
 */
import { doc, getDoc, type DocumentData, type Firestore } from 'firebase/firestore';

import type { GodwitBenefit } from '@/lib/firebase/sales/activeTripDetailTypes';
import { db as defaultDb } from '@/lib/firebase/firestore';

export type GodwitBenefitsSource = 'linkedHotel' | 'partnership' | 'saleFormFallback' | 'none';

export type ExtractedGodwitBenefits = {
  godwitBenefits: GodwitBenefit[];
  benefitsText: string | null;
  benefitsSource: GodwitBenefitsSource;
  preferredPartnershipId: string | null;
  preferredPartnershipName: string | null;
};

function asRecord(value: unknown): DocumentData | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DocumentData;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const t = value.trim();
  return t.length ? t : null;
}

function findServiceFormField(
  service: DocumentData | null | undefined,
  fieldKey: string,
): string | null {
  if (!service) {
    return null;
  }
  const sections =
    (service.additionalFields as unknown[]) || (service.additionalProperties as unknown[]) || [];
  if (!Array.isArray(sections)) {
    return null;
  }
  for (const section of sections) {
    const sec = asRecord(section);
    const fields = Array.isArray(sec?.fields) ? sec.fields : [];
    for (const field of fields) {
      const f = asRecord(field);
      if (f && String(f.fieldKey || '') === fieldKey) {
        const v = readString(f.value) ?? readString(f.dateValue) ?? readString(f.textValue);
        if (v) {
          return v;
        }
      }
    }
  }
  return null;
}

function saleFormGodwitBenefits(saleData: DocumentData): string | null {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  const service = Array.isArray(saleData.serviceModelList)
    ? asRecord(saleData.serviceModelList[0])
    : null;
  return (
    findServiceFormField(service, 'godwitBenefits') ||
    readString(walkIn.godwitBenefits) ||
    readString(saleData.godwitBenefits)
  );
}

/** Split CRM text → bullet lines (title + optional note). */
export function parseGodwitBenefitLines(value: string | null): GodwitBenefit[] {
  if (!value) {
    return [];
  }
  const lines = value
    .split(/\r?\n|•|·|;|\|/g)
    .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(/\s+[—–-]\s+|:\s+/);
    if (parts.length >= 2) {
      return {
        title: parts[0].trim(),
        note: parts.slice(1).join(' — ').trim() || null,
      };
    }
    const paren = line.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (paren) {
      return { title: paren[1].trim(), note: paren[2].trim() || null };
    }
    return { title: line, note: null };
  });
}

export function readPreferredPartnershipId(saleData: DocumentData): string | null {
  const walkIn = asRecord(saleData.walkInModel) ?? {};
  return readString(saleData.preferredPartnershipId) || readString(walkIn.preferredPartnershipId);
}

/**
 * Core extract — pass sale doc + optional already-loaded partnership doc.
 * Prefer calling this from getActiveTripDetail after one sale getDoc.
 */
export function extractGodwitBenefitsFromHotelSale(
  saleData: DocumentData,
  partnershipData: DocumentData | null,
): ExtractedGodwitBenefits {
  const walkIn = asRecord(saleData.walkInModel) ?? {};

  const preferredPartnershipId = readPreferredPartnershipId(saleData);

  const preferredPartnershipName =
    readString(saleData.preferredPartnershipName) ||
    readString(walkIn.preferredPartnershipName) ||
    (partnershipData ? readString(partnershipData.name) : null);

  if (partnershipData) {
    const hotelBrandId = readString(saleData.hotelBrandId) || readString(walkIn.hotelBrandId) || '';

    const hotelNameKey = (
      readString(saleData.hotelBrand) ||
      readString(walkIn.hotelBrand) ||
      readString(walkIn.customHotelBrand) ||
      readString(walkIn.hotelAirlines) ||
      readString(walkIn.nameOfHotel) ||
      ''
    ).toLowerCase();

    const links = Array.isArray(partnershipData.linkedSuppliers)
      ? partnershipData.linkedSuppliers
      : [];

    for (const raw of links) {
      const link = asRecord(raw);
      if (!link) {
        continue;
      }
      const linkHotelId = String(link.hotelId || link.supplierId || '').trim();
      const linkName = String(link.name || '')
        .trim()
        .toLowerCase();
      const linkBenefits = readString(link.standardBenefits);
      const idMatch = !!hotelBrandId && linkHotelId === hotelBrandId;
      const nameMatch = !!hotelNameKey && !!linkName && linkName === hotelNameKey;
      if ((idMatch || nameMatch) && linkBenefits) {
        return {
          benefitsText: linkBenefits,
          godwitBenefits: parseGodwitBenefitLines(linkBenefits),
          benefitsSource: 'linkedHotel',
          preferredPartnershipId,
          preferredPartnershipName,
        };
      }
    }

    const partnershipBenefits =
      readString(partnershipData.standardBenefits) ||
      (Array.isArray(partnershipData.benefits)
        ? partnershipData.benefits.map(String).join('\n')
        : null);

    if (partnershipBenefits) {
      return {
        benefitsText: partnershipBenefits,
        godwitBenefits: parseGodwitBenefitLines(partnershipBenefits),
        benefitsSource: 'partnership',
        preferredPartnershipId,
        preferredPartnershipName,
      };
    }
  }

  const saleForm = saleFormGodwitBenefits(saleData);
  if (saleForm) {
    return {
      benefitsText: saleForm,
      godwitBenefits: parseGodwitBenefitLines(saleForm),
      benefitsSource: 'saleFormFallback',
      preferredPartnershipId,
      preferredPartnershipName,
    };
  }

  return {
    benefitsText: null,
    godwitBenefits: [],
    benefitsSource: 'none',
    preferredPartnershipId,
    preferredPartnershipName,
  };
}

/** Load partnership catalog doc under the same admin. */
export async function loadPreferredPartnership(
  adminId: string,
  preferredPartnershipId: string,
  firestore: Firestore = defaultDb,
): Promise<DocumentData | null> {
  const aid = adminId.trim();
  const pid = preferredPartnershipId.trim();
  if (!aid || !pid) {
    return null;
  }
  const ref = doc(firestore, 'admins', aid, 'preferredPartnerships', pid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * Standalone fetch (sale + partnership). Prefer getClientSaleActiveTripDetail
 * so the sale is not read twice when opening hotel detail.
 */
export async function fetchHotelGodwitBenefits(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<ExtractedGodwitBenefits> {
  const aid = adminId.trim();
  const cid = clientId.trim();
  const sid = saleId.trim();
  if (!aid || !cid || !sid) {
    throw new Error('adminId, clientId and saleId are required');
  }

  const saleRef = doc(firestore, 'admins', aid, 'clients', cid, 'sales', sid);
  const saleSnap = await getDoc(saleRef);
  if (!saleSnap.exists()) {
    return {
      benefitsText: null,
      godwitBenefits: [],
      benefitsSource: 'none',
      preferredPartnershipId: null,
      preferredPartnershipName: null,
    };
  }

  const saleData = saleSnap.data();
  const partnershipId = readPreferredPartnershipId(saleData);
  const partnershipData = partnershipId
    ? await loadPreferredPartnership(aid, partnershipId, firestore)
    : null;

  return extractGodwitBenefitsFromHotelSale(saleData, partnershipData);
}

export async function fetchHotelGodwitBenefitsSafe(
  adminId: string,
  clientId: string,
  saleId: string,
  firestore: Firestore = defaultDb,
): Promise<ExtractedGodwitBenefits & { errorMessage: string | null }> {
  try {
    const result = await fetchHotelGodwitBenefits(adminId, clientId, saleId, firestore);
    return { ...result, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Godwit benefits';
    console.error('[fetchHotelGodwitBenefits]', error);
    return {
      benefitsText: null,
      godwitBenefits: [],
      benefitsSource: 'none',
      preferredPartnershipId: null,
      preferredPartnershipName: null,
      errorMessage: message,
    };
  }
}
