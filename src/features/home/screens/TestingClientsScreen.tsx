import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  checkFirebaseConnection,
  getClientByAdminAndClientIdSafe,
  getClientEmailsForAdminSafe,
  type ClientEmailSummary,
  type ClientNameEmail,
} from '@/lib/firebase/testing/getClientByEmail';
import {
  getClientTrips,
  type ClientTripSummary,
} from '../../../lib/firebase/testing/getClientTrips';
import { TEST_CLIENT_LOOKUP_ADMIN_ID, TEST_CLIENT_LOOKUP_ID } from '@/mocks/testingClientSession';
import { colors } from '@/ui/tokens/colors';
import { fontFamily } from '@/ui/tokens/typography';

const TAB_BAR_CLEARANCE = 96;

type TestingClientsData = {
  connected: boolean;
  message: string;
  clients: ClientEmailSummary[];
  pinnedClient: ClientNameEmail | null;
  pinnedError: string | null;
  trips: ClientTripSummary[];
  tripsNote: string | null;
};

/**
 * Sequential + retries: Expo Go Firestore often fails when many heavy reads
 * race on cold start. Critical path = pinned client + sales bookings first.
 */
async function fetchTestingClientsData(): Promise<TestingClientsData> {
  const status = await checkFirebaseConnection();

  if (!status.connected) {
    // Throw so React Query retries instead of caching an empty "offline" result.
    throw new Error(status.message);
  }

  const pinned = await getClientByAdminAndClientIdSafe();
  const tripsResult = await getClientTrips();

  // Soft fail: sales empty + salesError should retry the whole fetch.
  if (tripsResult.salesError && tripsResult.trips.length === 0) {
    throw new Error(tripsResult.salesError);
  }

  const emailList = await getClientEmailsForAdminSafe(TEST_CLIENT_LOOKUP_ADMIN_ID);

  const tripsNoteParts = [
    tripsResult.salesError ? `sales: ${tripsResult.salesError}` : null,
    tripsResult.servicesError ? `customerServices: ${tripsResult.servicesError}` : null,
    emailList.errorMessage ? `emails: ${emailList.errorMessage}` : null,
  ].filter(Boolean);

  return {
    connected: true,
    message: pinned.client
      ? `Session: ${pinned.client.name ?? pinned.client.clientId}`
      : status.message,
    clients: emailList.clients,
    pinnedClient: pinned.client,
    pinnedError: pinned.errorMessage,
    trips: tripsResult.trips,
    tripsNote: tripsNoteParts.length > 0 ? tripsNoteParts.join(' · ') : null,
  };
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

function TripRow({ trip }: { trip: ClientTripSummary }) {
  const title = trip.hotelBrand ?? trip.clientName ?? `Booking ${trip.id.slice(0, 8)}`;
  const when = trip.travelDate ?? trip.travelDateKey ?? trip.createdDate ?? '— no travel date —';

  return (
    <View style={styles.clientRow}>
      <Text style={styles.clientName} selectable>
        {title}
      </Text>
      <Text style={styles.clientMeta} selectable>
        date: {when}
      </Text>
      <Text style={styles.clientMeta} selectable>
        {trip.bucket} · {trip.source}
        {trip.saleStatus === false ? ' · cancelled' : ''}
      </Text>
      <Text style={styles.clientMeta} selectable>
        visitId: {trip.id}
      </Text>
      {trip.customerId ? (
        <Text style={styles.clientMeta} selectable>
          travellerId: {trip.customerId}
        </Text>
      ) : null}
    </View>
  );
}

export function TestingClientsScreen() {
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      'testing',
      'clients-trips',
      'v4-retry-sales-first',
      TEST_CLIENT_LOOKUP_ADMIN_ID,
      TEST_CLIENT_LOOKUP_ID,
    ],
    queryFn: fetchTestingClientsData,
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const loading = isPending;
  const connected = data?.connected ?? false;
  const message =
    data?.message ?? (isError ? (error instanceof Error ? error.message : 'Load failed') : '');
  const clientsWithEmail = data?.clients ?? [];
  const pinnedClient = data?.pinnedClient ?? null;
  const pinnedError = data?.pinnedError ?? null;
  const trips = data?.trips ?? [];
  const tripsNote = data?.tripsNote ?? null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Testing
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh testing data"
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
              <Text style={styles.statusText}>
                {isFetching && !loading ? `${message} · refreshing…` : message}
              </Text>
            </View>

            {connected ? (
              <>
                <Text style={styles.sectionLabel}>TEST CLIENT · STORED IN SESSION</Text>
                {pinnedClient ? (
                  <View style={[styles.clientRow, styles.highlightRow]}>
                    <Text style={styles.clientName} selectable>
                      {pinnedClient.name ?? '— no name —'}
                    </Text>
                    <Text style={styles.clientMeta} selectable>
                      {pinnedClient.contactEmail ?? '— no email —'}
                    </Text>
                    <Text style={styles.clientMeta} selectable>
                      Home will greet this name · avatar uses first letter
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    {pinnedError
                      ? `Could not load client: ${pinnedError}`
                      : `Not found at admins/${TEST_CLIENT_LOOKUP_ADMIN_ID}/clients/${TEST_CLIENT_LOOKUP_ID}`}
                  </Text>
                )}

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

                <Text style={styles.sectionLabel}>
                  BOOKINGS ({trips.length}) · {TEST_CLIENT_LOOKUP_ID}
                </Text>
                {tripsNote ? <Text style={styles.emptyText}>{tripsNote}</Text> : null}
                {trips.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No sales / customerServices visits for this client (or rules blocked reads).
                  </Text>
                ) : (
                  trips.map((trip) => <TripRow key={`${trip.source}-${trip.id}`} trip={trip} />)
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
  highlightRow: {
    borderColor: colors.forest,
    borderWidth: 1,
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
