import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ActiveTripDetailScreen } from '@/features/trips/screens/ActiveTripDetailScreen';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
import { colors } from '@/ui/tokens/colors';

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
  const { profile, isHydrating } = useActiveClientProfile();

  const { saleId, adminId, clientId } = useMemo(() => {
    const nextSaleId = firstParam(params.saleId).trim();
    const nextAdminId = firstParam(params.adminId).trim() || profile?.adminId?.trim() || '';
    const nextClientId = firstParam(params.clientId).trim() || profile?.clientId?.trim() || '';
    return {
      saleId: nextSaleId,
      adminId: nextAdminId,
      clientId: nextClientId,
    };
  }, [params.saleId, params.adminId, params.clientId, profile]);

  if (isHydrating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return <ActiveTripDetailScreen adminId={adminId} clientId={clientId} saleId={saleId} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
