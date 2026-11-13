/**
 * Hotel request — Stay · Travellers · Notes · Review wizard.
 */
import { HotelRequestWizard } from '@/features/requests/hotel/components/HotelRequestWizard';

type HotelRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function HotelRequestScreen({ onBack, clearTabBar = false }: HotelRequestScreenProps) {
  return <HotelRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
