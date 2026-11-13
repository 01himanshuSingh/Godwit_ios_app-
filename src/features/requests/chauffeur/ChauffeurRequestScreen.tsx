/**
 * Chauffeur request — Trip · Passengers · Notes · Review wizard.
 */
import { ChauffeurRequestWizard } from '@/features/requests/chauffeur/components/ChauffeurRequestWizard';

type ChauffeurRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function ChauffeurRequestScreen({
  onBack,
  clearTabBar = false,
}: ChauffeurRequestScreenProps) {
  return <ChauffeurRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
