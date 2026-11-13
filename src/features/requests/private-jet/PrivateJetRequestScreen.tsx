/**
 * Private jet request — opened from New request → Private jet card.
 */
import { PrivateJetRequestWizard } from '@/features/requests/private-jet/components/PrivateJetRequestWizard';

type PrivateJetRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function PrivateJetRequestScreen({
  onBack,
  clearTabBar = false,
}: PrivateJetRequestScreenProps) {
  return <PrivateJetRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
