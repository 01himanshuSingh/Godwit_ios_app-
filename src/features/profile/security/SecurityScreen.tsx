import { ProfileSectionPlaceholder } from '@/features/profile/components/ProfileSectionPlaceholder';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';

export function SecurityScreen() {
  return (
    <ProfileSectionShell title="Security" subtitle="Sign-in, devices and sessions.">
      <ProfileSectionPlaceholder message="Devices, sessions and sign-in controls will live here." />
    </ProfileSectionShell>
  );
}
