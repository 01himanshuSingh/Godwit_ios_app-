/**
 * Profile → Payments.
 * Header + amount-due card (client ledger) + invoices list (client sales).
 */
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ProfileSectionShell } from '@/features/profile/components/ProfileSectionShell';
import { AmountDueCard } from '@/features/profile/payments/components/AmountDueCard';
import { InvoicesListCard } from '@/features/profile/payments/components/InvoicesListCard';
import { getClientInvoicesSafe, getClientPaymentsCardSafe } from '@/lib/firebase/payments';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

export function PaymentsScreen() {
  const { width } = useWindowDimensions();
  const actionSize = width < 360 ? 12 : 14;
  const actionLineHeight = width < 360 ? 16 : 20;

  const { profile, isHydrating } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;
  const ready = !isHydrating && Boolean(adminId && clientId);

  const paymentsQuery = useQuery({
    queryKey: ['profile', 'payments', 'amount-due', adminId, clientId],
    queryFn: () => getClientPaymentsCardSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const invoicesQuery = useQuery({
    queryKey: ['profile', 'payments', 'invoices', adminId, clientId],
    queryFn: () => getClientInvoicesSafe(adminId, clientId),
    enabled: ready,
    retry: 2,
  });

  const card = paymentsQuery.data?.card ?? null;
  const invoices = invoicesQuery.data?.invoices ?? [];

  const loadError =
    paymentsQuery.data?.errorMessage ??
    invoicesQuery.data?.errorMessage ??
    (paymentsQuery.isError
      ? paymentsQuery.error instanceof Error
        ? paymentsQuery.error.message
        : 'Failed to load payments'
      : null) ??
    (invoicesQuery.isError
      ? invoicesQuery.error instanceof Error
        ? invoicesQuery.error.message
        : 'Failed to load invoices'
      : null);

  const loading =
    isHydrating ||
    ((paymentsQuery.isPending || invoicesQuery.isPending) &&
      !card &&
      invoices.length === 0 &&
      !loadError);

  return (
    <ProfileSectionShell
      title="Payments"
      subtitle="Everything owed to Godwit, and everything you have paid."
      subtitleTrailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account statement"
          hitSlop={8}
          onPress={() => {
            Alert.alert(
              'Account statement',
              'Your Godwit account statement will be available here soon.',
            );
          }}
          style={styles.statementHit}
        >
          <Text
            style={[styles.statementLabel, { fontSize: actionSize, lineHeight: actionLineHeight }]}
          >
            Account{'\n'}statement
          </Text>
        </Pressable>
      }
    >
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
              void paymentsQuery.refetch();
              void invoicesQuery.refetch();
            }}
            style={styles.retry}
          >
            <Text style={styles.retryLabel}>
              {paymentsQuery.isFetching || invoicesQuery.isFetching ? 'Retrying…' : 'Retry'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !loadError ? (
        <View style={styles.stack}>
          {card ? <AmountDueCard card={card} /> : null}
          <InvoicesListCard invoices={invoices} />
        </View>
      ) : null}
    </ProfileSectionShell>
  );
}

const styles = StyleSheet.create({
  statementHit: {
    alignItems: 'flex-end',
  },
  statementLabel: {
    fontFamily: fontFamily.manrope.regular,
    color: colors.muted,
    textAlign: 'right',
  },
  stack: {
    gap: 22,
  },
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
