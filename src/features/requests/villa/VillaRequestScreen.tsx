/**
 * Villa request — Stay · Travellers · Notes · Review wizard.
 */
import { VillaRequestWizard } from '@/features/requests/villa/components/VillaRequestWizard';

type VillaRequestScreenProps = {
  onBack: () => void;
  clearTabBar?: boolean;
};

export function VillaRequestScreen({ onBack, clearTabBar = false }: VillaRequestScreenProps) {
  return <VillaRequestWizard onBack={onBack} clearTabBar={clearTabBar} />;
}
