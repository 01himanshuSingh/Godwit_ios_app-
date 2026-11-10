import { Timestamp } from 'firebase/firestore';

import type { AppRequest } from './appRequestTypes';
import type { ResolvedBranchAndService } from './resolveBranchAndService';
import type { ServiceMapEntry } from './serviceMap';

type BuildEnquiryDocumentInput = {
  enquiryId: string;
  adminId: string;
  clientId: string;
  clientName: string;
  request: AppRequest;
  map: ServiceMapEntry;
  resolved: ResolvedBranchAndService;
  now?: Timestamp;
};

/**
 * Pure document builder — shared envelope for all 8 services.
 * App never sets endStaff*, saleId, or Sold status.
 */
export function buildEnquiryDocument({
  enquiryId,
  adminId,
  clientId,
  clientName,
  request,
  map,
  resolved,
  now = Timestamp.now(),
}: BuildEnquiryDocumentInput): Record<string, unknown> {
  const main = request.main.trim();
  const when = (request.when || '').trim() || 'Dates to be confirmed';
  const extra = (request.extra || '').trim();
  const notes = (request.notes || '').trim();
  const travellerIds = (request.travellerIds || []).map((id) => id.trim()).filter(Boolean);

  const nameById = new Map(
    (request.travellers || []).map((t) => [t.id.trim(), t.name.trim()] as const),
  );
  const travellerName =
    travellerIds
      .map((id) => nameById.get(id) || '')
      .filter(Boolean)
      .join(', ') ||
    (request.travellers || [])
      .map((t) => t.name.trim())
      .filter(Boolean)
      .join(', ');

  const remarks = [
    `${map.mainLabel}: ${main}`,
    `When: ${when}`,
    extra && map.extraLabel ? `${map.extraLabel}: ${extra}` : null,
    ...(request.remarkLines || []).map((line) => line.trim()).filter(Boolean),
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const instantSaleFields: Record<string, string | number> = {
    [map.mainKey]: main,
    travelDate: when,
    additionalNotes: notes,
  };
  if (map.extraKey && extra) {
    instantSaleFields[map.extraKey] = extra;
  }
  // "other": notes also fill Instant Sale route/notes slot
  if (request.category === 'other' && notes) {
    instantSaleFields.route = notes;
  }
  // Service-specific CRM keys (hotel check-in/out, guest counts, …)
  for (const [key, value] of Object.entries(request.crmFields || {})) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;
    if (typeof value === 'string') {
      const text = value.trim();
      if (text) instantSaleFields[trimmedKey] = text;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      instantSaleFields[trimmedKey] = value;
    }
  }

  const { branchId, serviceId, serviceName } = resolved;

  return {
    enquiryId,
    customerVisitId: enquiryId,
    adminId,
    branchId,
    date: now,
    status: true,
    clientId,
    clientName,
    travellerId: travellerIds[0] || '',
    customerId: travellerIds[0] || '',
    travellerIds,
    travellerName,
    name: travellerName || clientName || '',
    tagIdList: [],
    tagModelList: [],
    reminderDateList: [],
    serviceIdList: serviceId ? [serviceId] : [],
    serviceModelList: [{ serviceId, serviceName }],
    source: 'client_app',
    createdByType: 'client',
    createdById: clientId,
    createdByName: clientName || '',
    appRequestId: enquiryId,
    enquiryModel: {
      status: 0, // Open → Client Enquiries list
      interestIndex: 2, // High
      remind: true,
      date: now,
      endDate: now,
      endRemarks: '',
      serviceId,
      serviceName,
      remarks,
      appCategory: request.category,
      ...instantSaleFields,
      updateLogs: [
        {
          date: now,
          staffId: '',
          staffName: clientName || 'Client App',
          action: 'CREATED_FROM_APP',
          remarks: 'Service request submitted from Client App',
          changes: [
            `category=${request.category}`,
            `travellers=${travellerIds.join(',')}`,
            `serviceName=${serviceName}`,
          ],
        },
      ],
    },
  };
}
