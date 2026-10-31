/**
 * Something else request form — opened from New request → Something else card.
 * In-tab so HomeTabBar stays visible.
 */
import { RequestFormScreenShell } from '@/features/requests/components/RequestFormScreenShell';
import { SomethingElseRequestForm } from '@/features/requests/something-else/components/SomethingElseRequestForm';

type SomethingElseRequestScreenProps = {
  /** Back to category grid (Requests header + Change what you need). */
  onBack: () => void;
  clearTabBar?: boolean;
};

export function SomethingElseRequestScreen({
  onBack,
  clearTabBar = false,
}: SomethingElseRequestScreenProps) {
  return (
    <RequestFormScreenShell title="Something else" onBack={onBack} clearTabBar={clearTabBar}>
      <SomethingElseRequestForm />
    </RequestFormScreenShell>
  );
}
