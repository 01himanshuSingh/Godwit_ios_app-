/**
 * Villa request form — opened from New request → Villa card.
 * In-tab so HomeTabBar stays visible.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { VillaRequestForm } from '@/features/requests/villa/components/VillaRequestForm';

type VillaRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function VillaRequestScreen({ onBack, clearTabBar = false }: VillaRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Villa" onBack={onBack} clearTabBar={clearTabBar}>
      <VillaRequestForm />
    </RequestFormScreenShell>
  );
}
