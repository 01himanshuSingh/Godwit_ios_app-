import { useLocalSearchParams } from 'expo-router';

import { ActiveTripDetailScreen } from '@/features/trips/screens/ActiveTripDetailScreen';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function ActiveTripDetailRoute() {
  const params = useLocalSearchParams<{
    saleId: string;
    adminId?: string;
    clientId?: string;
  }>();

  const saleId = firstParam(params.saleId);
  const adminId = firstParam(params.adminId) || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = firstParam(params.clientId) || TEST_CLIENT_LOOKUP_ID;

  return <ActiveTripDetailScreen adminId={adminId} clientId={clientId} saleId={saleId} />;
}
