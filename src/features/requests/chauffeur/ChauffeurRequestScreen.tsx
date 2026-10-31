/**
 * Chauffeur request form — opened from New request → Chauffeur card.
 * In-tab so HomeTabBar stays visible.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { ChauffeurRequestForm } from '@/features/requests/chauffeur/components/ChauffeurRequestForm';

type ChauffeurRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function ChauffeurRequestScreen({
  onBack,
  clearTabBar = false,
}: ChauffeurRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Chauffeur" onBack={onBack} clearTabBar={clearTabBar}>
      <ChauffeurRequestForm />
    </RequestFormScreenShell>
  );
}
