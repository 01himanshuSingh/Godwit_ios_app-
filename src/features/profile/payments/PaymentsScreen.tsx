import { ProfileSectionPlaceholder } from '@/features/profile/components/ProfileSectionPlaceholder';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';

export function PaymentsScreen() {
  return (
    <ProfileSectionShell title="Payments" subtitle="Invoices, payments received and statements.">
      <ProfileSectionPlaceholder message="Ledger and invoice views will load here from client billing data." />
    </ProfileSectionShell>
  );
}
