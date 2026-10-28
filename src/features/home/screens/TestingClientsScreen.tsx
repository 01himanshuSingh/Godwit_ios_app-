import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  checkFirebaseConnection,
  getClientByAdminAndClientIdSafe,
  getClientEmailsForAdminSafe,
  type ClientEmailSummary,
  type ClientNameEmail,
} from '@/lib/firebase/testing/getClientByEmail';
import {
  logHotelConfirmationCounts,
  testFirstHotelConfirmationCounts,
  type HotelConfirmationCountReport,
} from '@/lib/firebase/testing/api/testFirstHotelConfirmationCounts';
import {
  logHotelRoomTypeTest,
  testFirstHotelRoomType,
  type HotelRoomTypeTestReport,
} from '@/lib/firebase/testing/api/testFirstHotelRoomType';
import {
  logYachtSaleTest,
  testFirstYachtSale,
  type YachtSaleTestReport,
} from '@/lib/firebase/testing/api/testFirstYachtSale';
import {
  logClientSaleVouchers,
  testClientSaleVouchers,
  type ClientSaleVouchersReport,
} from '@/lib/firebase/testing/api/testClientSaleVouchers';
import { openSaleVoucherPdf } from '@/lib/firebase/sales/getSaleVoucherPdf';
import {
  getClientTrips,
  type ClientTripSummary,
} from '../../../lib/firebase/testing/getClientTrips';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';
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

function presenceLabel(flag: 0 | 1): string {
  return flag === 1 ? '1 · present' : '0 · missing';
}

/** Always-visible Testing card — first yacht Instant Sale for session client. */
function FirstYachtTestCard({
  report,
  isLoading,
  errorMessage,
  adminId,
  clientId,
}: {
  report: YachtSaleTestReport | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  adminId: string;
  clientId: string;
}) {
  const statusNote =
    errorMessage ||
    report?.errorMessage ||
    (!report && !isLoading ? 'Waiting for backend…' : null) ||
    (report && !report.foundYachtSale ? 'No yacht Instant Sale found for this client' : null);

  return (
    <View style={styles.hotelRoomCard}>
      <Text style={styles.hotelRoomCardTitle}>FIRST YACHT (BACKEND)</Text>
      {isLoading && !report ? (
        <ActivityIndicator color={colors.forest} style={{ marginVertical: 8 }} />
      ) : null}

      {report?.foundYachtSale ? (
        <View style={styles.yachtPreview}>
          <Text style={styles.yachtTime}>{report.displayTime || '—'}</Text>
          <View style={styles.yachtBody}>
            <Text style={styles.yachtType}>{report.serviceTypeLabel}</Text>
            <Text style={styles.hotelRoomValue} selectable>
              {report.title || 'Yacht'}
            </Text>
            {report.detailLine ? (
              <Text style={styles.clientMeta} selectable>
                {report.detailLine}
              </Text>
            ) : null}
            <Text style={styles.clientMeta} selectable>
              {report.statusLabel}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.clientMeta} selectable>
        city: {report?.destinationCity ?? '—'} · brand: {report?.brand ?? '—'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        description: {report?.yachtDescription ?? '—'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        meal: {report?.mealDescription ?? '—'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        PNR: {report?.bookingReference ?? '—'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        service date: {report?.serviceDate ?? '—'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        saleId: {report?.saleId ?? 'null'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        adminId: {report?.adminId ?? adminId} · clientId: {report?.clientId ?? clientId}
      </Text>
      {statusNote ? <Text style={styles.emptyText}>{statusNote}</Text> : null}
    </View>
  );
}

/** Always-visible Testing card — hotel name + room type from first hotel sale. */
function HotelRoomTypeTestCard({
  report,
  isLoading,
  errorMessage,
  adminId,
  clientId,
}: {
  report: HotelRoomTypeTestReport | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  adminId: string;
  clientId: string;
}) {
  const hotelName = report?.hotelName ?? null;
  const roomType = report?.roomType ?? null;
  const saleId = report?.saleId ?? null;
  const roomSource = report?.roomSource ?? 'none';
  const rooms =
    report?.roomTypes && report.roomTypes.length > 0 ? report.roomTypes.join(' · ') : null;
  const statusNote =
    errorMessage ||
    report?.errorMessage ||
    (!report && !isLoading ? 'Waiting for backend…' : null) ||
    (report && !report.foundHotelSale ? 'No hotel Instant Sale found for this client' : null);

  return (
    <View style={styles.hotelRoomCard}>
      <Text style={styles.hotelRoomCardTitle}>FIRST HOTEL (BACKEND)</Text>
      {isLoading && !report ? (
        <ActivityIndicator color={colors.forest} style={{ marginVertical: 8 }} />
      ) : null}
      <Text style={styles.hotelRoomValue} selectable>
        hotel name: {hotelName === null ? 'null' : hotelName}
      </Text>
      <Text style={styles.hotelRoomValue} selectable>
        room type: {roomType === null ? 'null' : roomType}
      </Text>
      <Text style={styles.clientMeta} selectable>
        rooms: {rooms === null ? 'null' : rooms}
      </Text>
      <Text style={styles.clientMeta} selectable>
        room source: {roomSource}
      </Text>
      <Text style={styles.clientMeta} selectable>
        saleId: {saleId === null ? 'null' : saleId}
      </Text>
      <Text style={styles.clientMeta} selectable>
        adminId: {report?.adminId ?? adminId} · clientId: {report?.clientId ?? clientId}
      </Text>
      {statusNote ? <Text style={styles.emptyText}>{statusNote}</Text> : null}
    </View>
  );
}

/** Session sales with `confirmationDoc` PDF — exercises getSaleVoucherPdf. */
function SaleVouchersTestCard({
  report,
  isLoading,
  errorMessage,
  adminId,
  clientId,
}: {
  report: ClientSaleVouchersReport | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  adminId: string;
  clientId: string;
}) {
  const statusNote =
    errorMessage ||
    report?.errorMessage ||
    (!report && !isLoading ? 'Waiting for backend…' : null) ||
    (report && report.vouchersFound === 0
      ? `No confirmationDoc PDF on ${report.salesScanned} sales`
      : null);

  return (
    <View style={styles.hotelRoomCard}>
      <Text style={styles.hotelRoomCardTitle}>SALE VOUCHERS · confirmationDoc</Text>
      {isLoading && !report ? (
        <ActivityIndicator color={colors.forest} style={{ marginVertical: 8 }} />
      ) : null}
      <Text style={styles.clientMeta} selectable>
        scanned: {report?.salesScanned ?? '—'} · with PDF: {report?.vouchersFound ?? '—'}
      </Text>
      <Text style={styles.clientMeta} selectable>
        adminId: {report?.adminId ?? adminId} · clientId: {report?.clientId ?? clientId}
      </Text>
      {report?.vouchers.map((v) => (
        <View key={v.saleId} style={styles.voucherRow}>
          <Text style={styles.hotelRoomValue} selectable>
            {v.serviceName ?? 'Sale'} · {v.confirmationNo ?? 'no conf #'}
          </Text>
          <Text style={styles.clientMeta} selectable>
            saleId: {v.saleId}
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open voucher PDF"
            onPress={() => {
              void openSaleVoucherPdf(v.voucherUrl);
            }}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.voucherLink} selectable>
              {v.voucherUrl}
            </Text>
          </Pressable>
          {v.verifiedVoucherUrl ? (
            <Text style={styles.clientMeta} selectable>
              getSaleVoucherPdf: {v.verifiedVoucherUrl === v.voucherUrl ? 'match' : 'mismatch'}
            </Text>
          ) : null}
        </View>
      ))}
      {statusNote ? <Text style={styles.emptyText}>{statusNote}</Text> : null}
    </View>
  );
}

function HotelConfirmationTestCard({
  report,
  isLoading,
}: {
  report: HotelConfirmationCountReport | undefined;
  isLoading: boolean;
}) {
  if (isLoading && !report) {
    return (
      <View style={styles.clientRow}>
        <ActivityIndicator color={colors.forest} />
        <Text style={styles.clientMeta}>Loading first hotel confirmation counts…</Text>
      </View>
    );
  }

  if (!report) {
    return null;
  }

  if (!report.foundHotelSale) {
    return (
      <View style={[styles.clientRow, styles.testCard]}>
        <Text style={styles.clientName}>No hotel sale</Text>
        <Text style={styles.clientMeta} selectable>
          adminId: {report.adminId ?? '—'}
        </Text>
        <Text style={styles.clientMeta} selectable>
          clientId: {report.clientId ?? '—'}
        </Text>
        <Text style={styles.emptyText}>
          {report.errorMessage ?? 'No hotel Instant Sale found for this client'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.clientRow, styles.testCard, styles.highlightRow]}>
      <Text style={styles.clientName} selectable>
        First hotel sale · {report.fieldsPresentCount}/{report.totalChecked} fields
      </Text>
      <Text style={styles.clientMeta} selectable>
        adminId: {report.adminId}
      </Text>
      <Text style={styles.clientMeta} selectable>
        clientId: {report.clientId}
      </Text>
      <Text style={styles.clientMeta} selectable>
        saleId: {report.saleId}
      </Text>
      <Text style={styles.clientMeta} selectable>
        path: {report.documentPath}
      </Text>
      <Text style={styles.clientMeta} selectable>
        confirmationNo: {presenceLabel(report.counts.confirmationNo)} (
        {report.sources.confirmationNo})
      </Text>
      <Text style={styles.clientMeta} selectable>
        address: {presenceLabel(report.counts.address)} ({report.sources.address})
      </Text>
      <Text style={styles.clientMeta} selectable>
        mealPlan: {presenceLabel(report.counts.mealPlan)} ({report.sources.mealPlan})
      </Text>
      <Text style={styles.clientMeta} selectable>
        serviceFormSections: {report.serviceFormSectionsCount}
      </Text>
    </View>
  );
}

export function TestingClientsScreen() {
  const { profile } = useActiveClientProfile();
  const adminId = profile?.adminId?.trim() || TEST_CLIENT_LOOKUP_ADMIN_ID;
  const clientId = profile?.clientId?.trim() || TEST_CLIENT_LOOKUP_ID;

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['testing', 'clients-trips', 'v4-retry-sales-first', adminId, clientId],
    queryFn: fetchTestingClientsData,
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const confirmationQuery = useQuery({
    queryKey: ['testing', 'hotel-confirmation-counts', adminId, clientId],
    queryFn: async () => {
      const report = await testFirstHotelConfirmationCounts(adminId, clientId);
      logHotelConfirmationCounts(report);
      return report;
    },
    enabled: Boolean(adminId && clientId),
    retry: 2,
  });

  const roomTypeQuery = useQuery({
    queryKey: ['testing', 'hotel-room-type', adminId, clientId],
    queryFn: async () => {
      const report = await testFirstHotelRoomType(adminId, clientId);
      logHotelRoomTypeTest(report);
      return report;
    },
    enabled: Boolean(adminId && clientId),
    retry: 2,
  });

  /** Session adminId + clientId → first yacht Instant Sale (Testing tab only). */
  const yachtQuery = useQuery({
    queryKey: ['testing', 'first-yacht-sale', adminId, clientId],
    queryFn: async () => {
      const report = await testFirstYachtSale(adminId, clientId);
      logYachtSaleTest(report);
      return report;
    },
    enabled: Boolean(adminId && clientId),
    retry: 2,
  });

  /** Session sales with confirmationDoc PDF URL (Testing tab only). */
  const vouchersQuery = useQuery({
    queryKey: ['testing', 'sale-vouchers', adminId, clientId],
    queryFn: async () => {
      const report = await testClientSaleVouchers(adminId, clientId);
      logClientSaleVouchers(report);
      return report;
    },
    enabled: Boolean(adminId && clientId),
    retry: 2,
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

  const refreshAll = () => {
    void refetch();
    void confirmationQuery.refetch();
    void roomTypeQuery.refetch();
    void yachtQuery.refetch();
    void vouchersQuery.refetch();
  };

  return (
    <View style={styles.root}>
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Testing
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh testing data"
          onPress={refreshAll}
          disabled={
            isFetching ||
            confirmationQuery.isFetching ||
            roomTypeQuery.isFetching ||
            yachtQuery.isFetching ||
            vouchersQuery.isFetching
          }
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
        >
          <Feather name="refresh-cw" size={20} color={colors.forest} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Always visible on Test tab render — session adminId / clientId */}
        <Text style={styles.sectionLabel}>SALE VOUCHERS · SESSION CLIENT</Text>
        <SaleVouchersTestCard
          report={vouchersQuery.data}
          isLoading={vouchersQuery.isPending || vouchersQuery.isFetching}
          errorMessage={
            vouchersQuery.isError
              ? vouchersQuery.error instanceof Error
                ? vouchersQuery.error.message
                : 'Failed to load sale vouchers'
              : null
          }
          adminId={adminId}
          clientId={clientId}
        />

        <Text style={styles.sectionLabel}>FIRST YACHT · SESSION CLIENT</Text>
        <FirstYachtTestCard
          report={yachtQuery.data}
          isLoading={yachtQuery.isPending || yachtQuery.isFetching}
          errorMessage={
            yachtQuery.isError
              ? yachtQuery.error instanceof Error
                ? yachtQuery.error.message
                : 'Failed to load yacht sale'
              : null
          }
          adminId={adminId}
          clientId={clientId}
        />

        <Text style={styles.sectionLabel}>FIRST HOTEL · NAME + ROOM TYPE</Text>
        <HotelRoomTypeTestCard
          report={roomTypeQuery.data}
          isLoading={roomTypeQuery.isPending || roomTypeQuery.isFetching}
          errorMessage={
            roomTypeQuery.isError
              ? roomTypeQuery.error instanceof Error
                ? roomTypeQuery.error.message
                : 'Failed to load hotel room type'
              : null
          }
          adminId={adminId}
          clientId={clientId}
        />

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

                <Text style={styles.sectionLabel}>HOTEL CONFIRMATION COUNTS (TEST API)</Text>
                <Text style={styles.clientMeta}>
                  First hotel Instant Sale · presence only (not field values) · admin/client session
                </Text>
                <HotelConfirmationTestCard
                  report={confirmationQuery.data}
                  isLoading={confirmationQuery.isPending || confirmationQuery.isFetching}
                />

                <Text style={styles.sectionLabel}>
                  BOOKINGS ({trips.length}) · {clientId}
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
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
  testCard: {
    gap: 8,
  },
  hotelRoomCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.forest,
    padding: 16,
    gap: 8,
    width: '100%',
  },
  hotelRoomCardTitle: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hotelRoomValue: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.forest,
  },
  yachtPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 4,
  },
  yachtTime: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 15,
    color: colors.forest,
    minWidth: 48,
    marginTop: 2,
  },
  yachtBody: {
    flex: 1,
    gap: 3,
  },
  yachtType: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  voucherRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 4,
  },
  voucherLink: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.forest,
    textDecorationLine: 'underline',
  },
});
