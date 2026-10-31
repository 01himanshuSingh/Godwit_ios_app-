/**
 * Flight request form — opened from New request → Flight card.
 * In-tab so HomeTabBar stays visible.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { FlightRequestForm } from '@/features/requests/flight/components/FlightRequestForm';

type FlightRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function FlightRequestScreen({ onBack, clearTabBar = false }: FlightRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Flight" onBack={onBack} clearTabBar={clearTabBar}>
      <FlightRequestForm />
    </RequestFormScreenShell>
  );
}
