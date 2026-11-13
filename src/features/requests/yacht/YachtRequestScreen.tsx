/**
 * Yacht request — Charter · Guests · Notes · Review wizard.
 */
import { YachtRequestWizard } from '@/features/requests/yacht/components/YachtRequestWizard';

type YachtRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function YachtRequestScreen({ onBack, clearTabBar = false }: YachtRequestScreenProps) {
  return <YachtRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
