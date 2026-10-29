import { ProfileSectionPlaceholder } from '@/features/profile/components/ProfileSectionPlaceholder';
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';

export function NotificationsScreen() {
  return (
    <ProfileSectionShell title="Notifications" subtitle="What your Godwit team has sent you.">
      <ProfileSectionPlaceholder message="In-app notifications feed will load here." />
    </ProfileSectionShell>
  );
}
