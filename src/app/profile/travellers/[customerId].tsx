import { useLocalSearchParams } from 'expo-router';

import { TravellerDetailScreen } from '@/features/profile/travellers/TravellerDetailScreen';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function TravellerDetailRoute() {
  const params = useLocalSearchParams<{ customerId: string }>();
  const customerId = firstParam(params.customerId);
  return <TravellerDetailScreen customerId={customerId} />;
}
