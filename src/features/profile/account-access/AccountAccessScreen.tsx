import { ProfileSectionPlaceholder } from '@/features/profile/components/ProfileSectionPlaceholder';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';

export function AccountAccessScreen() {
  return (
    <ProfileSectionShell title="Account access" subtitle="Who may use this Godwit account.">
      <ProfileSectionPlaceholder message="Account users and access requests will load here." />
    </ProfileSectionShell>
  );
}
