/**
 * Flight request — opened from New request → Flight card.
 * In-tab so HomeTabBar stays visible.
 */
import { FlightRequestWizard } from '@/features/requests/flight/components/FlightRequestWizard';

type FlightRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function FlightRequestScreen({ onBack, clearTabBar = false }: FlightRequestScreenProps) {
  return <FlightRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
