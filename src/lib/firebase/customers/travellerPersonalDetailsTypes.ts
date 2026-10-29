/**
 * Traveller Personal Details — detail screen view model.
 * Source: admins/{adminId}/customers/{customerId}
 */

export type TravellerPersonalDetails = {
  customerId: string;
  fullName: string | null;
  /** e.g. "12 April 1978" */
  dateOfBirthLabel: string | null;
  nationality: string | null;
  relationship: string | null;
  email: string | null;
  telephone: string | null;
  mobileCountryCode: string | null;
  /** e.g. "India · born 12 April 1978" — only parts that exist */
  summaryLine: string | null;
  documentPath: string;
};

export type GetTravellerPersonalDetailsResult = {
  details: TravellerPersonalDetails | null;
  errorMessage: string | null;
};
