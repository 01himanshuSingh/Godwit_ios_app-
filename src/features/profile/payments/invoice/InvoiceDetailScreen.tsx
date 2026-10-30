/**
 * Profile → Payments → Invoice detail.
 * Scope: admins/{adminId}/clients/{clientId}/sales/{saleId}
 */
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { InvoiceDetailCard } from '@/features/profile/payments/invoice/components/InvoiceDetailCard';
import { getClientInvoiceSafe } from '@/lib/firebase/payments';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

type InvoiceDetailScreenProps = {
  saleId: string;
};

export function InvoiceDetailScreen({ saleId }: InvoiceDetailScreenProps) {
  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;
  const sid = saleId.trim();
  const ready = !isHydrating && Boolean(adminId && clientId && sid);

  const invoiceQuery = useQuery({
    queryKey: ['profile', 'payments', 'invoice', adminId, clientId, sid],
    queryFn: () => getClientInvoiceSafe(adminId, clientId, sid),
    enabled: ready,
    retry: 2,
  });

  const invoice = invoiceQuery.data?.invoice ?? null;
  const loadError =
    invoiceQuery.data?.errorMessage ??
    (invoiceQuery.isError
      ? invoiceQuery.error instanceof Error
        ? invoiceQuery.error.message
        : 'Failed to load invoice'
      : null);

  const loading = isHydrating || (invoiceQuery.isPending && !invoice && !loadError);

  const title = invoice?.invoiceNumber || 'Invoice';
  const subtitle = invoice?.title || null;

  return (
    <ProfileSectionShell title={title} subtitle={subtitle} backLabel="Payments">
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} />
        </View>
      ) : null}

      {!loading && loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable
            onPress={() => {
              void invoiceQuery.refetch();
            }}
            style={styles.retry}
          >
            <Text style={styles.retryLabel}>{invoiceQuery.isFetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !loadError && invoice ? <InvoiceDetailCard invoice={invoice} /> : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  errorBox: {
    borderRadius: 16,
    backgroundColor: '#F8F7F4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 14,
    color: colors.forest,
  },
});
