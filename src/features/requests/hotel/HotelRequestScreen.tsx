/**
 * Hotel request form — opened from New request → Hotel card.
 * In-tab so HomeTabBar stays visible.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { HotelRequestForm } from '@/features/requests/hotel/components/HotelRequestForm';

type HotelRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function HotelRequestScreen({ onBack, clearTabBar = false }: HotelRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Hotel" onBack={onBack} clearTabBar={clearTabBar}>
      <HotelRequestForm />
    </RequestFormScreenShell>
  );
}
