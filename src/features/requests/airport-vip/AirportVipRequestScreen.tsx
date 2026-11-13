/**
 * Airport VIP request — Service · Travellers · Notes · Review wizard.
 */
import { AirportVipRequestWizard } from '@/features/requests/airport-vip/components/AirportVipRequestWizard';

type AirportVipRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function AirportVipRequestScreen({
  onBack,
  clearTabBar = false,
}: AirportVipRequestScreenProps) {
  return <AirportVipRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
