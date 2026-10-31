/**
 * Yacht request form — opened from New request → Yacht card.
 * In-tab so HomeTabBar stays visible.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { YachtRequestForm } from '@/features/requests/yacht/components/YachtRequestForm';

type YachtRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function YachtRequestScreen({ onBack, clearTabBar = false }: YachtRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Yacht" onBack={onBack} clearTabBar={clearTabBar}>
      <YachtRequestForm />
    </RequestFormScreenShell>
  );
}
