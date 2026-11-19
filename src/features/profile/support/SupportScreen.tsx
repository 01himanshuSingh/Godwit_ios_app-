/**
 * Profile → Godwit Support.
 * Module not wired yet — premium empty / coming-soon UI only (no fake desk).
 */
import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { SupportEmptyCard } from '@/features/profile/support/components/SupportEmptyCard';

export function SupportScreen() {
  return (
    <ProfileSectionShell
      title="Godwit support"
      subtitle="Your travel team, available 24/7."
      layoutPreset="travellers"
    >
      <SupportEmptyCard />
    </ProfileSectionShell>
  );
}
