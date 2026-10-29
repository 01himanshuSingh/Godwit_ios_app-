import { ProfileSectionPlaceholder } from '@/features/profile/components/ProfileSectionPlaceholder';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';

export function SupportScreen() {
  return (
    <ProfileSectionShell title="Godwit support" subtitle="Your travel team, available 24/7.">
      <ProfileSectionPlaceholder message="Support contacts and message-Godwit entry will live here." />
    </ProfileSectionShell>
  );
}
