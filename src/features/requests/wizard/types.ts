export type WizardTabId = 'details' | 'travellers' | 'notes' | 'review';

export type WizardTabConfig = {
  id: WizardTabId;
  label: string;
};

export type WizardSummaryRow = {
  id: string;
  label: string;
  value: string;
  icon: 'pin' | 'calendar' | 'star' | 'door' | 'people' | 'note' | 'plane' | 'car' | 'boat';
};

export type ServiceWizardConfig = {
  title: string;
  subtitle: string;
  /** First-tab label — Stay / Trip / Charter / … */
  detailsTabLabel: string;
};
