/**
 * Universal Client App → CRM enquiry writer.
 *
 * many forms → SERVICE_MAP → ONE setDoc at admins/{adminId}/enquiries/{enquiryId}
 *
 * - Idempotent when appRequestId is supplied (retries overwrite same doc)
 * - Soft branch/service resolution (never blocks the customer)
 * - Never writes endStaff*, saleId, or Sold status
 */

import { collection, doc, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/firestore';
import { withFirestoreRetry } from '@/lib/firebase/withFirestoreRetry';

import type {
  AppRequest,
  EnquirySubmitSession,
  SubmitServiceRequestResult,
} from './appRequestTypes';
import { buildEnquiryDocument } from './buildEnquiryDocument';
import { EnquirySubmitError } from './EnquirySubmitError';
import { mapEnquirySubmitErrorToMessage } from './mapEnquirySubmitError';
import { resolveBranchAndService } from './resolveBranchAndService';
import { SERVICE_MAP } from './serviceMap';

function validateSession(session: EnquirySubmitSession): {
  adminId: string;
  clientId: string;
  clientName: string;
} {
  const adminId = session.adminId.trim();
  const clientId = session.clientId.trim();
  const clientName = session.clientName.trim();
  if (!adminId || !clientId) {
    throw new EnquirySubmitError(
      'missing_scope',
      'Your session is missing client details. Please sign out and sign in again.',
    );
  }
  return { adminId, clientId, clientName };
}

function validateRequest(req: AppRequest): AppRequest {
  const main = (req.main || '').trim();
  if (!main) {
    throw new EnquirySubmitError('validation', 'Please fill in the main details for this request.');
  }

  const travellerIds = (req.travellerIds || []).map((id) => id.trim()).filter(Boolean);
  if (travellerIds.length === 0) {
    throw new EnquirySubmitError('validation', 'Please select who is travelling.');
  }

  if (!(req.category in SERVICE_MAP)) {
    throw new EnquirySubmitError('validation', 'This service type is not supported yet.');
  }

  return {
    ...req,
    main,
    when: (req.when || '').trim() || undefined,
    extra: (req.extra || '').trim() || undefined,
    notes: (req.notes || '').trim() || undefined,
    travellerIds,
    travellers: (req.travellers || [])
      .map((t) => ({ id: t.id.trim(), name: t.name.trim() }))
      .filter((t) => t.id && t.name),
  };
}

/** Client-generated enquiry id (no write) — keeps retries idempotent. */
export function createEnquiryRequestId(adminId: string): string {
  return doc(collection(db, 'admins', adminId.trim(), 'enquiries')).id;
}

export async function submitServiceRequestToCrmEnquiry(
  session: EnquirySubmitSession,
  req: AppRequest,
  appRequestId?: string,
): Promise<SubmitServiceRequestResult> {
  const { adminId, clientId, clientName } = validateSession(session);
  const request = validateRequest(req);
  const map = SERVICE_MAP[request.category];

  const resolved = await resolveBranchAndService(adminId, map);
  const enquiryId = (appRequestId || '').trim() || createEnquiryRequestId(adminId);

  const payload = buildEnquiryDocument({
    enquiryId,
    adminId,
    clientId,
    clientName,
    request,
    map,
    resolved,
  });

  // Guardrail: app must never stamp conversion fields
  const enquiryModel = payload.enquiryModel as Record<string, unknown>;
  delete (payload as { endStaffId?: unknown }).endStaffId;
  delete (payload as { endStaffName?: unknown }).endStaffName;
  delete (payload as { saleId?: unknown }).saleId;
  delete enquiryModel.endStaffId;
  delete enquiryModel.endStaffName;
  delete enquiryModel.saleId;
  enquiryModel.status = 0;

  await withFirestoreRetry('submitServiceRequestToCrmEnquiry', async () => {
    await setDoc(doc(db, 'admins', adminId, 'enquiries', enquiryId), payload, { merge: true });
  });

  return {
    enquiryId,
    branchId: resolved.branchId,
    serviceName: resolved.serviceName,
  };
}

export async function submitServiceRequestToCrmEnquirySafe(
  session: EnquirySubmitSession,
  req: AppRequest,
  appRequestId?: string,
): Promise<{ result: SubmitServiceRequestResult | null; errorMessage: string | null }> {
  try {
    const result = await submitServiceRequestToCrmEnquiry(session, req, appRequestId);
    return { result, errorMessage: null };
  } catch (error) {
    console.error('[submitServiceRequestToCrmEnquiry]', error);
    return { result: null, errorMessage: mapEnquirySubmitErrorToMessage(error) };
  }
}
