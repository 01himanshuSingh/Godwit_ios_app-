/**
 * Profile → Payments → Invoice detail.
 * CRM sale only — loading skeleton · mapped exceptions · no test-client fallbacks.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { PaymentsExceptionCard } from '@/features/profile/payments/components/PaymentsExceptionCard';
import { InvoiceDetailCard } from '@/features/profile/payments/invoice/components/InvoiceDetailCard';
import {
  classifyPaymentsLoadError,
  getClientInvoiceSafe,
  mapPaymentsLoadErrorToMessage,
  type PaymentsLoadErrorKind,
} from '@/lib/firebase/payments';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { isScreenBooting, ScreenBootLoader } from '@/ui/loading';

type InvoiceDetailScreenProps = {
  saleId: string;
};

type ScreenException = {
  kind: PaymentsLoadErrorKind;
  message: string;
  canRetry: boolean;
};

export function InvoiceDetailScreen({ saleId }: InvoiceDetailScreenProps) {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() ?? '';
  const clientId = profile?.clientId?.trim() ?? '';
  const sid = saleId.trim();
  const hasScope = Boolean(adminId && clientId && sid);
  const ready = !isHydrating && hasScope;

  const invoiceQuery = useQuery({
    queryKey: ['profile', 'payments', 'invoice', adminId, clientId, sid],
    queryFn: () => getClientInvoiceSafe(adminId, clientId, sid),
    enabled: ready,
    retry: 2,
  });

  const invoice = invoiceQuery.data?.invoice ?? null;

  const exception = useMemo((): ScreenException | null => {
    if (isHydrating) return null;

    if (!hasScope) {
      return {
        kind: 'missing_scope',
        message: 'Account details are missing. Please sign in again.',
        canRetry: false,
      };
    }

    if (invoiceQuery.isError) {
      const kind = classifyPaymentsLoadError(invoiceQuery.error);
      return {
        kind,
        message: mapPaymentsLoadErrorToMessage(invoiceQuery.error),
        canRetry: kind !== 'missing_scope' && kind !== 'auth',
      };
    }

    const mapped = invoiceQuery.data?.errorMessage?.trim();
    if (mapped && !invoice) {
      const kind: PaymentsLoadErrorKind = mapped.toLowerCase().includes('found')
        ? 'unknown'
        : classifyPaymentsLoadError(new Error(mapped));
      return {
        kind,
        message: mapped,
        canRetry: kind !== 'missing_scope' && kind !== 'auth',
      };
    }

    return null;
  }, [
    hasScope,
    invoice,
    invoiceQuery.data?.errorMessage,
    invoiceQuery.error,
    invoiceQuery.isError,
    isHydrating,
  ]);

  const loading = isScreenBooting({
    isHydrating,
    enabled: hasScope,
    isPending: invoiceQuery.isPending,
    hasContent: Boolean(invoice),
    hasTerminalError: Boolean(exception),
  });

  if (loading) {
    return <ScreenBootLoader accessibilityLabel="Loading invoice" />;
  }

  /** CRM invoiceNo / service title only — never placeholders while loading. */
  const title = invoice?.invoiceNumber?.trim() || (exception ? 'Invoice' : null);
  const subtitle = invoice?.title?.trim() || null;

  return (
    <ProfileSectionShell
      title={title}
      subtitle={subtitle}
      backLabel="Payments"
      layoutPreset="invoiceDetail"
    >
      {exception ? (
        <PaymentsExceptionCard
          kind={exception.kind}
          message={exception.message}
          scope="invoice"
          isRetrying={invoiceQuery.isFetching}
          onRetry={exception.canRetry ? () => void invoiceQuery.refetch() : undefined}
        />
      ) : null}

      {!exception && invoice ? <InvoiceDetailCard invoice={invoice} /> : null}
    </ProfileSectionShell>
  );
}
