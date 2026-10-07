import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  checkFirebaseConnection,
  getAllClientEmailsSafe,
  type ClientEmailSummary,
} from '@/lib/firebase/testing/getClientByEmail';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 96;

type TestingClientsData = {
  connected: boolean;
  message: string;
  clients: ClientEmailSummary[];
};

async function fetchTestingClientsData(): Promise<TestingClientsData> {
  const status = await checkFirebaseConnection();

  if (!status.connected) {
    return { connected: false, message: status.message, clients: [] };
  }

  const { clients, errorMessage } = await getAllClientEmailsSafe();

  if (errorMessage) {
    return {
      connected: false,
      message: `Firestore reachable, but client load failed: ${errorMessage}`,
      clients: [],
    };
  }

  return { connected: true, message: status.message, clients };
}

function ClientWithEmailRow({ client }: { client: ClientEmailSummary }) {
  return (
    <View style={styles.clientRow}>
      <Text style={styles.clientName} selectable>
        {client.name ?? '— no name —'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        contactEmail: {client.contactEmail}
      </Text>
      <Text style={styles.clientMeta} selectable>
        clientId: {client.clientId}
      </Text>
      <Text style={styles.clientMeta} selectable>
        adminId: {client.adminId || '—'}
      </Text>
    </View>
  );
}

export function TestingClientsScreen() {
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: ['testing', 'clients-with-email'],
    queryFn: fetchTestingClientsData,
  });

  const loading = isPending;
  const connected = data?.connected ?? false;
  const message = data?.message ?? '';
  const clientsWithEmail = data?.clients ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Testing
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh clients with email"
            onPress={() => void refetch()}
            disabled={isFetching}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            <Feather name="refresh-cw" size={20} color={colors.forest} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.forest} size="large" style={styles.loader} />
        ) : (
          <>
            <View style={[styles.statusCard, connected ? styles.statusOk : styles.statusFail]}>
              <Feather
                name={connected ? 'check-circle' : 'alert-circle'}
                size={28}
                color={connected ? colors.forest : colors.muted}
              />
              <Text style={styles.statusText}>{message}</Text>
            </View>

            {connected ? (
              <>
                <Text style={styles.sectionLabel}>
                  CLIENTS WITH EMAIL ({clientsWithEmail.length})
                </Text>
                {clientsWithEmail.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No clients with a non-empty contactEmail in Firestore.
                  </Text>
                ) : (
                  clientsWithEmail.map((client) => (
                    <ClientWithEmailRow
                      key={`${client.adminId}-${client.clientId}`}
                      client={client}
                    />
                  ))
                )}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 28,
    color: colors.forest,
  },
  refreshButton: {
    padding: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: 12,
  },
  loader: {
    marginVertical: 48,
  },
  statusCard: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusOk: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  statusFail: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusText: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 8,
  },
  clientRow: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  clientName: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 15,
    color: colors.forest,
  },
  clientMeta: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    color: colors.muted,
  },
  emptyText: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 12,
  },
});
