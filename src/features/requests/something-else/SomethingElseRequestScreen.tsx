/**
 * Something else request — Details · Travellers · Notes · Review wizard.
 */
import { SomethingElseRequestWizard } from '@/features/requests/something-else/components/SomethingElseRequestWizard';

type SomethingElseRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function SomethingElseRequestScreen({
  onBack,
  clearTabBar = false,
}: SomethingElseRequestScreenProps) {
  return <SomethingElseRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
