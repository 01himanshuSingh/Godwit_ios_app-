import { useLocalSearchParams } from 'expo-router';

import { InvoiceDetailScreen } from '@/features/profile/payments/invoice';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function InvoiceDetailRoute() {
  const params = useLocalSearchParams<{ saleId: string }>();
  const saleId = firstParam(params.saleId);
  return <InvoiceDetailScreen saleId={saleId} />;
}
