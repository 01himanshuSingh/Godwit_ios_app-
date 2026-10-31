/**
 * Airport VIP request form — opened from New request → Airport VIP card.
 * In-tab so HomeTabBar stays visible.
 */
import { AirportVipRequestForm } from '@/features/requests/airport-vip/components/AirportVipRequestForm';
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';

type AirportVipRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function AirportVipRequestScreen({
  onBack,
  clearTabBar = false,
}: AirportVipRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Airport VIP" onBack={onBack} clearTabBar={clearTabBar}>
      <AirportVipRequestForm />
    </RequestFormScreenShell>
  );
}
