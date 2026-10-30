/**
 * Profile hub — UI view model for `admins/{adminId}/clients/{clientId}`.
 * Keep Firestore field names out of React components; map once here.
 */

export type ClientProfileView = {
  adminId: string;
  clientId: string;
  documentPath: string;
  /** ACCOUNT name — CRM `name` / `fullName` / `clientName`. */
  displayName: string;
  /** ACCOUNT email — `contactEmail` / `email`. */
  contactEmail: string | null;
  /**
   * Hero / Profile eyebrow:
   * surname + " Family" when a last name exists; single given name otherwise.
   * e.g. "Modi Family" | "Himanshu"
   */
  familyLabel: string;
  /** ACCOUNT role — `accountRole` / `role` / else `Principal - {familyLabel}`. */
  accountRole: string | null;
  /** YOUR DIRECTOR name. */
  directorName: string | null;
  /** YOUR DIRECTOR title — `directorTitle` or default. */
  directorTitle: string | null;
  /** Optional travellers count for menu subtitle. */
  travellerCount: number | null;
};

export type GetClientProfileResult = {
  profile: ClientProfileView | null;
  errorMessage: string | null;
};
