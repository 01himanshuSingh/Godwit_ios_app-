/**
 * Profile → Notifications.
 * Module not wired yet — premium empty / coming-soon UI only (no fake feed).
 */
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { NotificationsEmptyCard } from '@/features/profile/notifications/components/NotificationsEmptyCard';

export function NotificationsScreen() {
  return (
    <ProfileSectionShell
      title="Notifications"
      subtitle="What your Godwit team has sent you."
      layoutPreset="travellers"
    >
      <NotificationsEmptyCard />
    </ProfileSectionShell>
  );
}
