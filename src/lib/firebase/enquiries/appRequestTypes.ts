/**
 * Universal app → CRM enquiry request shape.
 * Every service form maps into this before the single writer runs.
 */

export type AppServiceCategory =
  | 'hotel'
  | 'flight'
  | 'private_jet'
  | 'villa'
  | 'yacht'
  | 'car_chauffeur'
  | 'airport_vip'
  | 'other';

export type AppRequestTraveller = {
  id: string;
  name: string;
};

export type AppRequest = {
  category: AppServiceCategory;
  /** Where / Route / City / Airport / Cruising area */
  main: string;
  /** Soft or ISO dates — CRM keeps non-ISO text in notes */
  when?: string;
  /** Rooms / Cabin / Passengers / … (raw value, no label prefix) */
  extra?: string;
  /** Anything we should know? */
  notes?: string;
  travellerIds: string[];
  /** Optional display names for travellerName / remarks */
  travellers?: AppRequestTraveller[];
  /**
   * Service-specific Instant Sale / CRM prefill keys (scalable escape hatch).
   * Merged into enquiryModel after SERVICE_MAP main/extra fields.
   */
  crmFields?: Record<string, string | number>;
  /** Extra human lines appended to enquiryModel.remarks */
  remarkLines?: string[];
};

export type EnquirySubmitSession = {
  adminId: string;
  clientId: string;
  clientName: string;
};

export type SubmitServiceRequestResult = {
  enquiryId: string;
  branchId: string;
  serviceName: string;
};
