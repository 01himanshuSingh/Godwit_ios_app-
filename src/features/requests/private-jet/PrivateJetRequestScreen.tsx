/**
 * Private jet request form — opened from New request → Private jet card.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { PrivateJetRequestForm } from '@/features/requests/private-jet/components/PrivateJetRequestForm';

type PrivateJetRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function PrivateJetRequestScreen({
  onBack,
  clearTabBar = false,
}: PrivateJetRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Private jet" onBack={onBack} clearTabBar={clearTabBar}>
      <PrivateJetRequestForm />
    </RequestFormScreenShell>
  );
}
